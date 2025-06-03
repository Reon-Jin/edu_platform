# backend/lesson.py

from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel
import pdfkit
import os

from backend.utils.deepseek_client import call_deepseek_api

router = APIRouter()


class LessonRequest(BaseModel):
    topic: str


@router.post("/prepare")
async def prepare_lesson(req: LessonRequest):
    """
    一键备课：接收 JSON { "topic": "..." }，调用 Deepseek 获取 Markdown 内容并返回。
    """
    topic = req.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic 不能为空")

    try:
        # 调用 Deepseek，prompt 直接使用 topic
        result = call_deepseek_api(prompt=topic)
        # Deepseek 返回格式假设为 { "choices": [ { "message": { "content": "..." } } ] }
        content = result["choices"][0]["message"]["content"]
        return {"markdown": content}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"调用 Deepseek API 失败：{e}")


@router.get("/export-pdf")
async def export_lesson_pdf(
    topic: str = Query(..., min_length=1)
):
    """
    导出 PDF：接收 query 参数 topic，先调用 Deepseek 生成 Markdown，
    再用 pdfkit 将 Markdown 转 HTML 再转 PDF，直接返回 PDF 流。
    """
    topic = topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic 不能为空")

    try:
        # 第一步：调用 Deepseek 获取 Markdown
        result = call_deepseek_api(prompt=topic)
        markdown_content = result["choices"][0]["message"]["content"]

        # 第二步：将 Markdown 转换为简单 HTML
        # 这里做最基础的转换：用 <pre> 标签包裹，保持 Markdown 格式
        # 如果需要更美观的效果，可以接入 markdown2、mistune 等库生成 HTML
        html_content = f"""
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {{ font-family: Arial, sans-serif; padding: 20px; }}
              pre {{ white-space: pre-wrap; word-wrap: break-word; }}
            </style>
          </head>
          <body>
            <pre>{markdown_content}</pre>
          </body>
        </html>
        """

        # 第三步：用 pdfkit 将 HTML 转为 PDF（二进制）
        # 确保系统已安装 wkhtmltopdf，并且在 PATH 中能直接调用
        pdf_bytes = pdfkit.from_string(html_content, False)

        # 返回 PDF 流，前端直接下载
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="lesson_{topic}.pdf"'
            },
        )
    except OSError as oe:
        # wkhtmltopdf 找不到或执行失败
        raise HTTPException(status_code=500, detail=f"PDF 生成失败，检查 wkhtmltopdf 是否安装：{oe}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"导出 PDF 失败：{e}")
