import os
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
import pdfkit
import markdown as md
from backend.config import settings
import backend.utils.deepseek_client as _ds

router = APIRouter()

class LessonRequest(BaseModel):
    topic: str
    export_pdf: bool = False

def load_knowledge_texts() -> list[str]:
    kb_dir = settings.KNOWLEDGE_BASE_DIR
    texts = []
    if not os.path.isdir(kb_dir):
        return texts
    for filename in os.listdir(kb_dir):
        if filename.lower().endswith(".txt"):
            path = os.path.join(kb_dir, filename)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        texts.append(content)
            except Exception:
                continue
    return texts

@router.post("/prepare")
async def prepare_and_export(req: LessonRequest):
    topic = req.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic 不能为空")

    knowledge_texts = load_knowledge_texts()
    if not knowledge_texts:
        raise HTTPException(status_code=500, detail="本地知识库为空或无法读取")

    combined_knowledge = "\n\n".join(knowledge_texts)
    full_prompt = (
        "你是老师的备课助手，请结合以下知识库内容为主题进行备课\n"
        f"知识库内容：\n{combined_knowledge}\n\n"
        "备课要求：\n"
        "1. 设计教学内容，需要包括：（1）知识讲解（2）实训练习与指导（3）时间分布；\n"
        f"2. 主题：{topic}。\n"
        "3. 课程时长：45分钟\n"
    )

    try:
        result = _ds.call_deepseek_api(prompt=full_prompt)
        markdown_content = result["choices"][0]["message"]["content"]

        if not req.export_pdf:
            return {"markdown": markdown_content}

        html_body = md.markdown(markdown_content, extensions=["extra", "sane_lists", "toc"])
        html_content = f"""
        <html><head><meta charset="utf-8"><style>
          /* ...CSS样式略... */
        </style></head><body>
          {html_body}
        </body></html>
        """

        pdf_bytes = pdfkit.from_string(html_content, False)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="lesson_{topic}.pdf"'},
        )

    except OSError as oe:
        raise HTTPException(status_code=500, detail=f"PDF 生成失败：{oe}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"备课/导出 PDF 失败：{e}")
