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
from backend.models import Exercise, Homework, Class, Submission
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
    type: Literal[
        "single_choice",
        "multiple_choice",
        "fill_in_blank",
        "short_answer",
        "coding",
    ]
    items: List[Union[str, Dict[str, Any]]]

class RawOutput(BaseModel):
    questions: List[RawQuestion]
    answers: Dict[str, Any]

class Item(BaseModel):
    id: int
    question: str
    options: List[str] = []

class QuestionBlock(BaseModel):
    type: Literal[
        "single_choice",
        "multiple_choice",
        "fill_in_blank",
        "short_answer",
        "coding",
    ]
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
    num_single_choice: int,
    num_multiple_choice: int,
    num_fill_blank: int,
    num_short_answer: int,
    num_programming: int,
) -> Dict[str, Any]:
    parts: List[str] = []
    if num_single_choice:
        parts.append(f"生成 {num_single_choice} 道单选题（每题4个选项，只有一个正确答案）；")
    if num_multiple_choice:
        parts.append(f"生成 {num_multiple_choice} 道多选题（每题至少4个选项且不止一个正确答案）；")
    if num_fill_blank:
        parts.append(f"生成 {num_fill_blank} 道填空题；")
    if num_short_answer:
        parts.append(f"生成 {num_short_answer} 道简答题；")
    if num_programming:
        parts.append(f"生成 {num_programming} 道编程题，并提供参考代码答案；")

    prompt = (
        f"请根据主题“{topic}”{''.join(parts)}\n\n"
        "– 请务必生成上面请求的数量，不要使用下面示例里的题目数量或具体内容。\n"
        "– 返回的内容务必严格按照以下JSON 结构，包括questions,type,items,answers等信息，请严格按照示例的字段名和嵌套层级输出。\n\n"
        "示例结构：\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
        '      "type": "single_choice",\n'
        '      "items": [\n'
        "        { \"id\": \"1\", \"question\": \"这是单选示例题1\", \"options\": [\"A. ...\",\"B. ...\",\"C. ...\",\"D. ...\"] },\n"
        "        { \"id\": \"2\", \"question\": \"这是单选示例题2\", \"options\": [\"A. ...\",\"B. ...\",\"C. ...\",\"D. ...\"] }\n"
        "      ]\n"
        "    },\n"
        "    {\n"
        '      "type": "multiple_choice",\n'
        '      "items": [\n'
        "        { \"id\": \"3\", \"question\": \"这是多选示例题\", \"options\": [\"A. ...\",\"B. ...\",\"C. ...\",\"D. ...\"] }\n"
        "      ]\n"
        "    },\n"
        "    {\n"
        '      "type": "fill_in_blank",\n'
        '      "items": [ { "id": "4", "question": "这是示例填空" } ]\n'
        "    },\n"
        "    {\n"
        '      "type": "short_answer",\n'
        '      "items": [ { "id": "5", "question": "这是示例简答" } ]\n'
        "    },\n"
        "    {\n"
        '      "type": "coding",\n'
        '      "items": [ { "id\": \"6\", \"question\": \"这是示例编程\" } ]\n'
        "    }\n"
        "  ],\n"
        '  "answers": { "1": "B", "2": "D", "3": ["A","B","C"], "4": "示例", "5": "示例", "6": "示例" }\n'
        "}\n\n"
        "注意：\n"
        "1. 上面只是示例 JSON 结构，示例里的题目数量和具体内容不要照搬。\n"
        "2. 请根据最前面“生成 X 道单选题/多选题/填空题/简答题/编程题”的要求，输出对应数量的题目。\n"
        "3. 严格按照示例的 key、层级和格式输出纯 JSON，不要多余文本、不要 Markdown、不要注释。\n"
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
    points: Dict[str, Any],
) -> Exercise:
    with Session(engine, expire_on_commit=False) as sess:
        ex = Exercise(
            teacher_id=teacher_id,
            subject=topic,
            prompt=questions,
            answers=answers,
            points=points,
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
    points: Dict[str, Any],
    class_id: int | None = None,
) -> Homework:
    with Session(engine, expire_on_commit=False) as sess:
        ex = Exercise(
            teacher_id=teacher_id,
            subject=topic,
            prompt=questions,
            answers=answers,
            points=points,
        )
        sess.add(ex)
        sess.commit()
        sess.refresh(ex)

        if class_id is not None:
            c = sess.get(Class, class_id)
            if not c:
                raise ValueError("class not found")

        hw = Homework(exercise_id=ex.id, class_id=class_id)
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


def assign_homework(exercise_id: int, class_id: int | None = None) -> Homework:
    with Session(engine, expire_on_commit=False) as sess:
        ex = sess.get(Exercise, exercise_id)
        if not ex:
            raise ValueError("exercise not found")
        if class_id is not None:
            c = sess.get(Class, class_id)
            if not c:
                raise ValueError("class not found")

        hw = Homework(exercise_id=exercise_id, class_id=class_id)
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

    with Session(engine) as sess:
        subs = sess.exec(
            select(Submission)
            .join(Homework, Submission.homework_id == Homework.id)
            .where(Homework.exercise_id == exercise_id)
        ).all()
        total = len(subs)
        avg = sum(s.score for s in subs) / total if total else 0.0
        return {"total_submissions": total, "average_score": avg}


def delete_exercise(exercise_id: int) -> bool:
    """Delete an exercise and all related homework/submissions."""
    with Session(engine, expire_on_commit=False) as sess:
        ex = sess.get(Exercise, exercise_id)
        if not ex:
            return False

        # remove related homework and submissions
        for hw in sess.exec(select(Homework).where(Homework.exercise_id == exercise_id)):
            for sub in sess.exec(select(Submission).where(Submission.homework_id == hw.id)):
                sess.delete(sub)
            sess.delete(hw)

        sess.delete(ex)
        sess.commit()
        return True
