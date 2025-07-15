import json
import re
from typing import Dict, Any, List, Union, Literal
from io import BytesIO
import copy
from pathlib import Path

from pydantic import BaseModel, root_validator
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont

from backend.utils.pdf_utils import (
    format_questions_html,
    format_answers_html,
    render_pdf,
)
from backend.models import Exercise, Homework
from backend.utils.deepseek_client import call_deepseek_api
from backend.config import engine

# ———————— 字体注册 ————————
DEFAULT_FONT = "STSong-Light"
try:
    noto = Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc")
    if noto.exists():
        pdfmetrics.registerFont(TTFont("NotoSansCJK", str(noto)))
        DEFAULT_FONT = "NotoSansCJK"
except Exception:
    pass
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


# ———————— Pydantic Models for 严格校验 ————————
class RawQuestion(BaseModel):
    type: Literal["multiple_choice", "fill_in_blank", "short_answer", "coding"]
    items: List[Union[str, Dict[str, Any]]]

class RawOutput(BaseModel):
    questions: List[RawQuestion]
    answers: Dict[str, Any]

class Item(BaseModel):
    id: int
    question: str
    options: List[str] = []

class QuestionBlock(BaseModel):
    type: Literal["multiple_choice", "fill_in_blank", "short_answer", "coding"]
    items: List[Item]

class ExerciseData(BaseModel):
    questions: List[QuestionBlock]
    answers: Dict[str, Any]

    @root_validator(skip_on_failure=True)
    def answers_match_ids(cls, values):
        q_blocks = values.get("questions", [])
        ans = values.get("answers", {})
        valid_ids = {item.id for block in q_blocks for item in block.items}
        cleaned = {k: v for k, v in ans.items() if int(k) in valid_ids}
        values["answers"] = cleaned
        return values


# ———————— 原始解析函数，不变 ————————
def _parse_model_response(resp: Dict[str, Any]) -> Dict[str, Any]:
    content = resp["choices"][0]["message"]["content"]
    start = content.find("{")
    end = content.rfind("}")
    if start == -1 or end == -1 or start > end:
        raise ValueError(f"无法解析模型响应 JSON：{content!r}")
    raw_json = content[start : end + 1]
    try:
        return json.loads(raw_json)
    except json.JSONDecodeError:
        print(">>> Raw JSON to load:", raw_json)
        raise


# ———————— 清洗并生成标准结构 ————————
def _clean_model_output(raw: Dict[str, Any]) -> ExerciseData:
    parsed = RawOutput(**raw)

    blocks: List[QuestionBlock] = []
    next_id = 1
    for rq in parsed.questions:
        items: List[Item] = []
        for it in rq.items:
            if isinstance(it, str):
                items.append(Item(id=next_id, question=it.strip(), options=[]))
            else:
                q_text = it.get("question", "").strip()
                opts = it.get("options")
                if opts is None:
                    opts = it.get("items", [])
                opts_clean = [str(o).strip() for o in opts]
                items.append(Item(id=next_id, question=q_text, options=opts_clean))
            next_id += 1
        blocks.append(QuestionBlock(type=rq.type, items=items))

    clean = ExerciseData(questions=blocks, answers=parsed.answers)
    return clean


# ———————— 主要逻辑：调用大模型并清洗 ————————
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

    prompt = (
        f"请根据主题“{topic}”{''.join(parts)}\n\n"
        '请以 JSON 格式返回：questions（列表，每项 {"type":..., "items":[...] }），'
        '其中type指的是题型，只能填 multiple_choice, fill_in_blank, short_answer, coding；'
        '选择题每个选项以 A. B. C. D. 开头。'
        "answers（对象，键为题目 id，值为参考答案）。"
        "请仅返回一段完整合法的 JSON，不要多余文本，不要 Markdown，也不要截断。"
    )
    resp = call_deepseek_api(prompt)
    raw = _parse_model_response(resp)
    clean = _clean_model_output(raw)
    return {
        "topic": topic,
        "questions": [b.dict() for b in clean.questions],
        "answers": clean.answers,
    }


def save_exercise(
    teacher_id: int,
    topic: str,
    questions: List[Dict[str, Any]],
    answers: Dict[str, Any],
) -> Exercise:
    with Session(engine, expire_on_commit=False) as sess:
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
    with Session(engine, expire_on_commit=False) as sess:
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

        hw = sess.exec(
            select(Homework)
            .options(selectinload(Homework.exercise))
            .where(Homework.id == hw.id)
        ).one()
        return hw


def list_exercises(teacher_id: int) -> List[Exercise]:
    with Session(engine) as sess:
        stmt = (
            select(Exercise)
            .where(Exercise.teacher_id == teacher_id)
            .order_by(Exercise.created_at.desc())
        )
        return sess.exec(stmt).all()


def get_exercise(ex_id: int) -> Exercise:
    with Session(engine) as sess:
        return sess.get(Exercise, ex_id)


def get_homework(homework_id: int) -> Homework:
    with Session(engine) as sess:
        return sess.exec(
            select(Homework)
            .options(selectinload(Homework.exercise))
            .where(Homework.id == homework_id)
        ).one_or_none()


def _normalize_blocks(raw_blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    把存库里的 raw_blocks 标准化：
      - 保留 type
      - 每个 block['items'] 中，若是字符串则转为 {'question': s, 'options': []}
      - 若是 dict，但有 key 'items' (AI 原始 JSON)，重命名为 'options'
    """
    blocks = copy.deepcopy(raw_blocks)
    for block in blocks:
        new_items = []
        for it in block.get("items", []):
            if isinstance(it, str):
                new_items.append({"question": it, "options": []})
            elif isinstance(it, dict):
                q = it.get("question", "")
                opts = it.get("options")
                if opts is None:
                    opts = it.get("items", [])
                new_items.append({"question": q, "options": opts})
            else:
                new_items.append({"question": str(it), "options": []})
        block["items"] = new_items
    return blocks


def _build_pdf(
    buffer: BytesIO,
    title: str,
    blocks: List[Dict[str, Any]],
    answers: Dict[str, Any] = None,
):
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=50,
        rightMargin=50,
        topMargin=60,
        bottomMargin=60,
    )
    styles = getSampleStyleSheet()
    normal = ParagraphStyle(
        "Normal_CN",
        parent=styles["Normal"],
        fontName=DEFAULT_FONT,
        fontSize=12,
        leading=16,
        bulletFontName="Helvetica",
    )
    title_style = ParagraphStyle(
        "Title_CN",
        parent=styles["Heading1"],
        fontName=DEFAULT_FONT,
        fontSize=18,
        alignment=TA_CENTER,
        spaceAfter=18,
    )
    qtype = ParagraphStyle(
        "QType_CN",
        parent=styles["Heading2"],
        fontName=DEFAULT_FONT,
        fontSize=14,
        alignment=TA_LEFT,
        spaceBefore=12,
        spaceAfter=6,
        bulletFontName="Helvetica",
    )

    story: List[Any] = [Paragraph(title, title_style)]
    for idx, block in enumerate(blocks, start=1):
        story.append(
            Paragraph(
                f"{idx}. { (block.get('type') or '').replace('_',' ').title() }", qtype
            )
        )
        for item in block.get("items", []):
            story.append(
                Paragraph(item.get("question", ""), normal, bulletText="\u2022")
            )
            story.append(Spacer(1, 4))
            for opt in item.get("options", []):
                story.append(Paragraph(opt, normal, bulletText="-"))
            story.append(Spacer(1, 8))
            if answers is not None:
                ans = answers.get(str(item.get("id")), "")
                story.append(Paragraph(f"答案：{ans}", normal))
                story.append(Spacer(1, 12))
    doc.build(story)


def _build_html(title: str, blocks: List[Dict[str, Any]], answers: Dict[str, Any] | None = None) -> str:
    parts = [f"<h1>{title}</h1>", format_questions_html(blocks)]
    if answers is not None:
        parts.append(format_answers_html(answers))
    body = "".join(parts)
    return f"<html><head><meta charset='utf-8'/></head><body>{body}</body></html>"


def render_exercise_pdf(
    title: str, blocks: List[Dict[str, Any]], answers: Dict[str, Any] | None = None
) -> bytes:
    html = _build_html(title, blocks, answers)
    return render_pdf(html)


def download_questions_pdf(ex: Exercise) -> bytes:
    blocks = _normalize_blocks(ex.prompt or [])
    html = _build_html(f"练习 #{ex.id} 题目", blocks, answers=None)
    return render_pdf(html)


def download_answers_pdf(ex: Exercise) -> bytes:
    blocks = _normalize_blocks(ex.prompt or [])
    html = _build_html(f"练习 #{ex.id} 答案", blocks, answers=ex.answers or {})
    return render_pdf(html)


def assign_homework(exercise_id: int) -> Homework:
    with Session(engine, expire_on_commit=False) as sess:
        ex = sess.get(Exercise, exercise_id)
        if not ex:
            raise ValueError("exercise not found")

        hw = Homework(exercise_id=exercise_id)
        sess.add(hw)
        sess.commit()
        sess.refresh(hw)

        hw = sess.exec(
            select(Homework)
            .options(selectinload(Homework.exercise))
            .where(Homework.id == hw.id)
        ).one()
        return hw


def stats_for_exercise(exercise_id: int) -> Dict[str, Any]:
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
