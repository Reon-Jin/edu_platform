# backend/services/lesson_service.py

import os
from typing import List, Union
import markdown as md
import pdfkit
import backend.utils.deepseek_client as _ds
from backend.config import settings

def load_knowledge_texts() -> List[str]:
    kb_dir = settings.KNOWLEDGE_BASE_DIR
    texts: List[str] = []
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

def _build_prompt(topic: str, knowledge_texts: List[str]) -> str:
    combined = "\n\n".join(knowledge_texts)
    return (
        "你是老师的备课助手，请结合以下知识库内容为主题进行备课\n"
        f"知识库内容：\n{combined}\n\n"
        "备课要求：\n"
        "1. 设计教学内容，需要包括：（1）知识讲解（2）实训练习与指导（3）时间分布；\n"
        f"2. 主题：{topic}。\n"
        "3. 课程时长：45分钟\n"
    )

async def generate_lesson(topic: str, export_pdf: bool = False) -> Union[str, bytes]:
    """
    返回 Markdown 文本（export_pdf=False）或 PDF 二进制（export_pdf=True）。
    """
    knowledge_texts = load_knowledge_texts()
    if not knowledge_texts:
        raise RuntimeError("本地知识库为空或无法读取")

    prompt = _build_prompt(topic, knowledge_texts)
    result = _ds.call_deepseek_api(prompt=prompt)
    markdown_content = result["choices"][0]["message"]["content"]

    if not export_pdf:
        return markdown_content

    # 转成 HTML
    html_body = md.markdown(markdown_content, extensions=["extra", "sane_lists", "toc"])
    html = f"""
    <html><head><meta charset="utf-8"><style>
      /* 可按需自定义样式 */
    </style></head><body>
      {html_body}
    </body></html>
    """
    # 生成 PDF
    try:
        pdf_bytes = pdfkit.from_string(html, False)
        return pdf_bytes
    except OSError as oe:
        raise RuntimeError(f"PDF 生成失败：{oe}")
