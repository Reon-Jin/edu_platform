# backend/routers/lesson_router.py

import io
import re
from urllib.parse import quote
from typing import Dict, List
from datetime import datetime

import markdown as md
import pdfkit
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from fastapi.responses import StreamingResponse, JSONResponse
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.services.lesson_service import generate_lesson
from backend.auth import get_current_user
from backend.models import User, Courseware
from backend.db import get_session, SessionLocal

router = APIRouter(prefix="/teacher/lesson", tags=["prepare"])

# 缓存：避免重复调用大模型
lesson_markdown_cache: Dict[str, str] = {}
lesson_prep_start: Dict[int, datetime] = {}

class LessonRequest(BaseModel):
    topic: str

class CoursewareMeta(BaseModel):
    id: int
    topic: str
    created_at: datetime

class CoursewarePreview(BaseModel):
    id: int
    topic: str
    markdown: str
    created_at: datetime


def _strip_outer_fences(md_text: str) -> str:
    """
    如果文本以 ``` 开头，以 ``` 结尾，就去掉这两行 fence，
    避免整个教案都被当作单个代码块。
    """
    lines = md_text.splitlines()
    if len(lines) >= 2 and lines[0].startswith("```") and lines[-1].startswith("```"):
        return "\n".join(lines[1:-1])
    return md_text


def _generate_and_store_pdf(cw_id: int, md_text: str):
    """
    后台任务：把 Markdown 渲染为 HTML（支持标题、列表、表格、代码块等），
    再生成 PDF 并写回数据库
    """
    # 1. 先去掉最外层的 fenced code
    clean_md = _strip_outer_fences(md_text)

    # 2. Markdown -> HTML，开启常见扩展
    html_body = md.markdown(
        clean_md,
        extensions=[
            "extra",
            "sane_lists",
            "toc",
            "fenced_code",
            "tables",
        ]
    )

    # 3. 包裹完整 HTML 并内嵌基本 CSS
    html = f"""
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body {{ font-family: sans-serif; padding: 20px; }}
          h1, h2, h3, h4 {{ font-weight: bold; margin-top: 1em; }}
          strong {{ font-weight: bold; }}
          em {{ font-style: italic; }}
          table {{ border-collapse: collapse; width: 100%; margin: 1em 0; }}
          table, th, td {{ border: 1px solid #333; padding: 6px; }}
          pre {{ background: #f5f5f5; padding: 10px; overflow: auto; }}
          code {{ background: #f0f0f0; padding: 2px 4px; }}
        </style>
      </head>
      <body>
        {html_body}
      </body>
    </html>
    """

    # 4. 生成 PDF
    pdf_bytes = pdfkit.from_string(html, False)

    # 5. 写回数据库（覆盖旧 PDF）
    db = SessionLocal()
    try:
        cw = db.get(Courseware, cw_id)
        cw.pdf = pdf_bytes
        db.add(cw)
        db.commit()
    finally:
        db.close()


@router.post(
    "/prepare",
    summary="生成教案 Markdown 预览",
    response_model=Dict[str, str],
)
async def prepare_lesson(
    req: LessonRequest,
    current_user: User = Depends(get_current_user),
):
    if not current_user.role or current_user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师角色访问")
    topic = req.topic.strip()
    if not topic:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="topic 不能为空")

    lesson_prep_start[current_user.id] = datetime.utcnow()
    if topic not in lesson_markdown_cache:
        try:
            md_text = await generate_lesson(topic)
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=str(e))
        lesson_markdown_cache[topic] = md_text
    else:
        md_text = lesson_markdown_cache[topic]

    return {"markdown": md_text}


@router.post(
    "/save",
    summary="保存课件（仅 Markdown，后台异步生成 PDF）",
    response_model=CoursewareMeta,
)
async def save_courseware(
    req: LessonRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not current_user.role or current_user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师角色访问")
    topic = req.topic.strip()
    if not topic:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="topic 不能为空")

    md_text = lesson_markdown_cache.get(topic) or await generate_lesson(topic)
    lesson_markdown_cache[topic] = md_text

    start_time = lesson_prep_start.pop(current_user.id, None)
    cw = Courseware(
        teacher_id=current_user.id,
        topic=topic,
        markdown=md_text,
        prep_start=start_time,
        prep_end=datetime.utcnow(),
    )
    session.add(cw)
    session.commit()
    session.refresh(cw)

    # 后台任务异步生成并存储 PDF（覆盖旧版）
    background_tasks.add_task(_generate_and_store_pdf, cw.id, md_text)

    return CoursewareMeta(id=cw.id, topic=cw.topic, created_at=cw.created_at)


@router.get(
    "/export_pdf/{cw_id}",
    summary="同步生成并下载最新 PDF",
    response_class=StreamingResponse,
)
async def export_pdf(
    cw_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not current_user.role or current_user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师角色访问")

    cw = session.get(Courseware, cw_id)
    if not cw or cw.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="课件不存在")

    # 直接同步渲染最新 Markdown，覆盖数据库中的 PDF
    clean_md = _strip_outer_fences(cw.markdown)
    html_body = md.markdown(
        clean_md,
        extensions=["extra", "sane_lists", "toc", "fenced_code", "tables"]
    )
    html = f"<html><head><meta charset='utf-8'/><style> \
            body {{ font-family: sans-serif; padding: 20px; }} \
            h1, h2, h3, h4 {{ font-weight: bold; margin-top: 1em; }} \
            strong {{ font-weight: bold; }} \
            em {{ font-style: italic; }} \
            table {{ border-collapse: collapse; width: 100%; margin: 1em 0; }} \
            table, th, td {{ border: 1px solid #333; padding: 6px; }} \
            pre {{ background: #f5f5f5; padding: 10px; overflow: auto; }} \
            code {{ background: #f0f0f0; padding: 2px 4px; }} \
          </style></head><body>{html_body}</body></html>"
    pdf_bytes = pdfkit.from_string(html, False)

    # 覆盖存库
    cw.pdf = pdf_bytes
    session.add(cw)
    session.commit()

    # 返回下载流
    raw_name = f"lesson_{cw.topic}.pdf"
    fallback = "lesson.pdf"
    quoted = quote(raw_name, safe='')
    headers = {"Content-Disposition": f"attachment; filename={fallback}; filename*=UTF-8''{quoted}"}
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)


@router.get(
    "/list",
    summary="获取我的课件列表",
    response_model=List[CoursewareMeta],
)
async def list_coursewares(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not current_user.role or current_user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师角色访问")
    stmt = select(Courseware).where(Courseware.teacher_id == current_user.id).order_by(Courseware.created_at.desc())
    items = session.exec(stmt).all()
    return [CoursewareMeta(id=c.id, topic=c.topic, created_at=c.created_at) for c in items]


@router.get(
    "/preview/{cw_id}",
    summary="预览已保存课件",
    response_model=CoursewarePreview,
)
async def preview_courseware(
    cw_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not current_user.role or current_user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师角色访问")
    cw = session.get(Courseware, cw_id)
    if not cw or cw.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="课件不存在")
    return CoursewarePreview(id=cw.id, topic=cw.topic, markdown=cw.markdown, created_at=cw.created_at)
