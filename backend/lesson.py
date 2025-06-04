# backend/lesson.py

import os
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel
import pdfkit
import markdown as md  # 用于将 Markdown 渲染为 HTML
from backend.config import settings
from backend.utils.deepseek_client import call_deepseek_api

router = APIRouter()


class LessonRequest(BaseModel):
    topic: str
    export_pdf: bool = False  # 如果为 True，则返回 PDF，否则返回 Markdown 文本


def load_knowledge_texts() -> list[str]:
    """
    从本地知识库目录（settings.KNOWLEDGE_BASE_DIR）读取所有 .txt 文件内容，
    返回一个字符串列表，每个元素对应一个文件的全文本。
    """
    kb_dir = "backend/knowledge/" # 如 "backend/knowledge/"
    if not os.path.isdir(kb_dir):
        return []

    texts = []
    for filename in os.listdir(kb_dir):
        if filename.lower().endswith(".txt"):
            path = os.path.join(kb_dir, filename)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        texts.append(content)
            except Exception:
                # 跳过无法读取的文件
                continue
    print(texts)
    return texts


@router.post("/prepare")
async def prepare_and_export(req: LessonRequest):
    """
    一键备课并可选导出 PDF：
    - 接收 JSON { "topic": "...", "export_pdf": true/false }
    - 从本地知识库加载所有 txt 文件内容，拼在 prompt 里
    - 调用 Deepseek 获取 Markdown 内容并返回
    - 如果 export_pdf=True，则再渲染 HTML 并生成 PDF
    """
    topic = req.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic 不能为空")

    # 1. 加载本地知识库文本
    knowledge_texts = load_knowledge_texts()
    if not knowledge_texts:
        raise HTTPException(status_code=500, detail="本地知识库为空或无法读取")

    # 2. 构建 prompt：包括主题、知识库内容、以及备课要求
    combined_knowledge = "\n\n".join(knowledge_texts)
    full_prompt = (
        "你是老师的备课助手，请结合以下知识库内容为主题进行备课\n"
        f"知识库内容：\n{combined_knowledge}\n\n"
        "备课要求：\n"
        "1. 设计教学内容，需要包括：（1）知识讲解（2）实训练习与指导（3）时间分布；\n"
        f"2. 主题：{topic}。\n"
        "3.课程时长：45分钟\n"
    )

    try:
        # 3. 调用 Deepseek 获取 Markdown
        result = call_deepseek_api(prompt=full_prompt)
        markdown_content = result["choices"][0]["message"]["content"]

        # 4. 如果不需要导出 PDF，仅返回 Markdown
        if not req.export_pdf:
            return {"markdown": markdown_content}

        # 5. 如果需要 PDF，先把 Markdown 渲染为 HTML
        html_body = md.markdown(markdown_content, extensions=["extra", "sane_lists", "toc"])
        html_content = f"""
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {{
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
              }}
              h1, h2, h3, h4, h5, h6 {{
                color: #333;
              }}
              pre {{
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
              }}
              code {{
                background-color: #f5f5f5;
                padding: 2px 4px;
                border-radius: 4px;
              }}
              blockquote {{
                border-left: 4px solid #ccc;
                padding-left: 10px;
                color: #666;
                margin: 1em 0;
              }}
              ul, ol {{
                margin: 1em 0;
                padding-left: 40px;
              }}
              table {{
                border-collapse: collapse;
                width: 100%;
                margin: 1em 0;
              }}
              th, td {{
                border: 1px solid #ddd;
                padding: 8px;
              }}
              th {{
                background-color: #f2f2f2;
                text-align: left;
              }}
            </style>
          </head>
          <body>
            {html_body}
          </body>
        </html>
        """

        # 6. 生成 PDF（二进制）
        pdf_bytes = pdfkit.from_string(html_content, False)

        # 7. 返回 PDF 流
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="lesson_{topic}.pdf"'},
        )

    except OSError as oe:
        # wkhtmltopdf 执行失败
        raise HTTPException(status_code=500, detail=f"PDF 生成失败，检查 wkhtmltopdf 是否安装：{oe}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"备课/导出 PDF 失败：{e}")
