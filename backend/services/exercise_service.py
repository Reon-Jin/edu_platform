# backend/services/exercise_service.py

import os
import json
import re
from typing import Dict, Any, List, Tuple
from io import BytesIO

from sqlmodel import Session, select
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
# 内置中文支持
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

from backend.models import Exercise, Homework
from backend.utils.deepseek_client import call_deepseek_api
from backend.config import engine, settings
from backend.utils import rag_pipeline

# 注册内置中文字体
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))

INDEX_DB = os.path.join(settings.KNOWLEDGE_BASE_DIR, "index.db")


def _retrieve_snippets(topic: str) -> List[Tuple[str, str]]:
    """Retrieve knowledge snippets related to the topic."""
    if not os.path.isfile(INDEX_DB):
        raise RuntimeError("知识库索引不存在，请先运行 prepare_knowledge.py")
    return rag_pipeline.retrieve(topic, INDEX_DB, top_k=5)


def _build_prompt(
    topic: str,
    parts_desc: List[str],
    snippets: List[Tuple[str, str]],
) -> str:
    if snippets:
        header = (
            f"以下是与“{topic}”相关的本地知识库内容，共 {len(snippets)} 条（仅供参考）：\n\n"
            + "\n".join(f"- [{doc}] {text}" for doc, text in snippets)
            + "\n\n"
        )
    else:
        header = (
            f"本地知识库中未找到与“{topic}”相关的内容，"
            "请结合专业教学经验补充完整知识点。\n\n"
        )

    return (
        "你是教师的出题助手，请结合以下知识库片段和自身教学经验，为主题设计练习题。\n\n"
        f"{header}"
        f"主题是“{topic}”{''.join(parts_desc)}\n\n"
        "请以 JSON 格式返回：questions（列表，每项 {\"type\":..., \"items\":[...] }），"
        "answers（对象，键为题目 id，值为参考答案）。"
    )


def _parse_model_response(resp: Dict[str, Any]) -> Dict[str, Any]:
    content: str = resp["choices"][0]["message"]["content"]
    text = re.sub(r"^```(?:json)?\s*", "", content)
    text = re.sub(r"\s*```$", "", text)
    data = json.loads(text)
    for block in data.get("questions", []):
        if not isinstance(block, dict):
            continue
        for item in block.get("items", []):
            if not isinstance(item, dict):
                continue
            if "question" not in item and "text" in item:
                item["question"] = item.pop("text")
            if "id" in item:
                item["id"] = str(item["id"])
    return data


def preview_exercise(
    topic: str,
    num_mcq: int,
    num_fill_blank: int,
    num_short_answer: int,
    num_programming: int,
) -> Dict[str, Any]:
    parts: List[str] = []
    if num_mcq:
        parts.append(f"生成 {num_mcq} 道选择题（每题4个选项）；")
    if num_fill_blank:
        parts.append(f"生成 {num_fill_blank} 道填空题；")
    if num_short_answer:
        parts.append(f"生成 {num_short_answer} 道简答题；")
    if num_programming:
        parts.append(f"生成 {num_programming} 道编程题，并提供参考代码答案；")

    snippets = _retrieve_snippets(topic)
    prompt = _build_prompt(topic, parts, snippets)
    resp = call_deepseek_api(prompt)
    data = _parse_model_response(resp)
    return {
        "topic": topic,
        "questions": data.get("questions", []),
        "answers": data.get("answers", {}),
    }


def save_exercise(
    teacher_id: int,
    topic: str,
    questions: List[Dict[str, Any]],
    answers: Dict[str, Any],
) -> Exercise:
    with Session(engine) as sess:
        ex = Exercise(
            teacher_id=teacher_id,
            subject=topic,
            prompt=questions,
            answers=answers,
        )
        sess.add(ex)
        sess.commit()
        sess.refresh(ex)
        return ex


def save_and_assign_exercise(
    teacher_id: int,
    topic: str,
    questions: List[Dict[str, Any]],
    answers: Dict[str, Any],
) -> Homework:
    with Session(engine) as sess:
        ex = Exercise(
            teacher_id=teacher_id,
            subject=topic,
            prompt=questions,
            answers=answers,
        )
        sess.add(ex)
        sess.commit()
        sess.refresh(ex)

        hw = Homework(exercise_id=ex.id)
        sess.add(hw)
        sess.commit()
        sess.refresh(hw)
        return hw


def get_exercise(ex_id: int) -> Exercise:
    with Session(engine) as sess:
        return sess.get(Exercise, ex_id)


def list_exercises(teacher_id: int) -> List[Exercise]:
    with Session(engine) as sess:
        stmt = select(Exercise).where(Exercise.teacher_id == teacher_id).order_by(Exercise.created_at.desc())
        return sess.exec(stmt).all()


def _build_pdf(buffer: BytesIO, title: str, blocks: List[Dict[str, Any]], answers: Dict[str, Any] = None) -> None:
    """
    使用 ReportLab Platypus 构建 PDF 文档，优化符号显示，使用 bulletText 参数以确保符号正确渲染。
    """
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            leftMargin=50, rightMargin=50,
                            topMargin=60, bottomMargin=60)
    styles = getSampleStyleSheet()
    # 基础样式
    normal_style = ParagraphStyle(
        'Normal_CN', parent=styles['Normal'],
        fontName='STSong-Light', fontSize=12, leading=16
    )
    title_style = ParagraphStyle(
        'Title_CN', parent=styles['Heading1'],
        fontName='STSong-Light', fontSize=18,
        alignment=TA_CENTER, spaceAfter=18
    )
    qtype_style = ParagraphStyle(
        'QType_CN', parent=styles['Heading2'],
        fontName='STSong-Light', fontSize=14,
        alignment=TA_LEFT, spaceBefore=12, spaceAfter=6
    )

    story: List[Any] = []
    story.append(Paragraph(title, title_style))

    for idx, block in enumerate(blocks, start=1):
        if not isinstance(block, dict):
            continue
        qtype = (block.get('type') or '').replace('_', ' ').title()
        story.append(Paragraph(f"{idx}. ({qtype})", qtype_style))

        for item in block.get('items') or []:
            if not isinstance(item, dict):
                continue
            question = item.get('question') or ''
            # 使用 bulletText 参数渲染题干符号，避免字体缺失
            story.append(Paragraph(question, normal_style, bulletText='•'))
            story.append(Spacer(1, 4))

            # 使用二级 bulletText 参数渲染选项符号
            for opt in item.get('options') or []:
                if not isinstance(opt, str):
                    continue
                story.append(Paragraph(opt, normal_style, bulletText='·'))
            story.append(Spacer(1, 8))

            # 如果需要展示答案
            if answers is not None:
                ans = answers.get(str(item.get('id')), '')
                # 答案不使用符号
                story.append(Paragraph(f"答案：{ans}", normal_style))
                story.append(Spacer(1, 12))

    doc.build(story)


def download_questions_pdf(ex: Exercise) -> bytes:
    buffer = BytesIO()
    title = f"练习 #{ex.id} 题目"
    blocks = ex.prompt or []
    _build_pdf(buffer, title, blocks, answers=None)
    return buffer.getvalue()


def download_answers_pdf(ex: Exercise) -> bytes:
    buffer = BytesIO()
    title = f"练习 #{ex.id} 答案"
    blocks = ex.prompt or []
    _build_pdf(buffer, title, blocks, answers=ex.answers or {})
    return buffer.getvalue()


def assign_homework(exercise_id: int) -> Homework:
    with Session(engine) as sess:
        hw = Homework(exercise_id=exercise_id)
        sess.add(hw)
        sess.commit()
        sess.refresh(hw)
        return hw


def stats_for_exercise(exercise_id: int) -> Dict[str, Any]:
    """Return statistics for submissions of a given exercise."""
    from backend.models import Submission
    with Session(engine) as sess:
        subs = sess.exec(
            select(Submission)
            .join(Homework, Submission.homework_id == Homework.id)
            .where(Homework.exercise_id == exercise_id)
        ).all()
        total = len(subs)
        avg = sum(s.score for s in subs) / total if total else 0.0
        return {"total_submissions": total, "average_score": avg}
