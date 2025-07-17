# backend/utils/pdf_utils.py

import pdfkit
from typing import Any, Dict, List
from backend.config import PDFKIT_CONFIG

def format_questions_html(questions: List[Dict[str, Any]]) -> str:
    """
    按题型分别渲染练习题，
    支持 'single_choice', 'multiple_choice', 'fill_in_the_blank', 'short_answer', 'programming'。
    """
    # 题型中文映射
    type_map = {
        "single_choice": "单选题",
        "multiple_choice": "多选题",
        "fill_in_blank": "填空题",
        "short_answer": "简答题",
        "coding": "编程题"
    }

    html = "<h1>练习题</h1>"
    for section in questions:
        qtype = section.get("type", "")
        # 取中文标题，找不到就用原值
        title = type_map.get(qtype, qtype)
        html += f"<h2>{title}</h2><ol>"

        for item in section.get("items", []):
            question = item.get("question", "")
            html += f"<li>{question}"

            # 只有选择题才渲染 options
            if qtype in ("single_choice", "multiple_choice"):
                html += "<ul>"
                for opt in item.get("options", []):
                    html += f"<li>{opt}</li>"
                html += "</ul>"

            html += "</li>"

        html += "</ol>"

    return html

def format_answers_html(answers: Dict[str, Any]) -> str:
    html = "<h1>参考答案</h1><ol>"
    for qid, ans in answers.items():
        html += f"<li>题目 {qid}: {ans}</li>"
    html += "</ol>"
    return html

def render_pdf(html_text: str) -> bytes:
    """
    生成 PDF，支持 UTF-8 和本地文件访问。
    """
    options = {
        "encoding": "UTF-8",
        "enable-local-file-access": None,
        "page-size": "A4",
        "margin-top":    "10mm",
        "margin-right":  "10mm",
        "margin-bottom": "10mm",
        "margin-left":   "10mm",
    }
    return pdfkit.from_string(html_text, False, configuration=PDFKIT_CONFIG, options=options)
