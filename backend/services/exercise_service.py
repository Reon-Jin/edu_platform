# backend/services/exercise_service.py

import json
import re
from typing import Dict, Any, List
from sqlmodel import Session, select
from backend.models import Exercise, Homework, Submission
from backend.utils.deepseek_client import call_deepseek_api
from backend.config import engine, PDFKIT_CONFIG
import pdfkit
from backend.utils.pdf_utils import format_questions_html, format_answers_html

def _parse_model_response(resp: Dict[str, Any]) -> Dict[str, Any]:
    content: str = resp["choices"][0]["message"]["content"]
    # 去掉 ```json 或 ``` 标记
    text = re.sub(r"^```(?:json)?\s*", "", content)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)

def generate_exercise(
    teacher_id: int,
    topic: str,
    num_mcq: int,
    num_fill_blank: int,
    num_short_answer: int,
    num_programming: int,
) -> Exercise:
    parts: List[str] = []
    if num_mcq:          parts.append(f"生成 {num_mcq} 道选择题（每题 4 个选项）；")
    if num_fill_blank:   parts.append(f"生成 {num_fill_blank} 道填空题；")
    if num_short_answer: parts.append(f"生成 {num_short_answer} 道简答题；")
    if num_programming:  parts.append(f"生成 {num_programming} 道编程题，并提供参考代码答案；")

    prompt = (
        f"请根据主题“{topic}”{''.join(parts)}\n\n"
        "请以 JSON 格式返回："
        "questions（列表，每项 {\"type\":...,\"items\":[{...}]}），"
        "answers（对象，键为题目 id，值为参考答案）。"
    )
    resp = call_deepseek_api(prompt)
    data = _parse_model_response(resp)
    questions = data.get("questions", [])
    answers   = data.get("answers", {})

    with Session(engine) as sess:
        ex = Exercise(
            teacher_id=teacher_id,
            subject=topic,
            prompt=questions,
            answers=answers
        )
        sess.add(ex)
        sess.commit()
        sess.refresh(ex)
        return ex

def get_exercise(ex_id: int) -> Exercise:
    with Session(engine) as sess:
        return sess.get(Exercise, ex_id)

def _render_pdf(body_html: str) -> bytes:
    full = f"""
    <html><head><meta charset="utf-8"><style>
      body {{ font-family:"Microsoft YaHei","SimHei",Arial,sans-serif; margin:20px; line-height:1.6 }}
      h1,h2 {{ color:#333 }} pre,code {{ background:#f5f5f5; padding:8px; border-radius:4px; overflow-x:auto }}
      ul,ol {{ margin:1em 0; padding-left:40px }} table{{border-collapse:collapse;width:100%;margin:1em 0}}
      th,td{{border:1px solid #ddd;padding:8px}} th{{background:#f2f2f2}}
    </style></head><body>{body_html}</body></html>
    """
    options = {
        "encoding": "UTF-8",
        "enable-local-file-access": None,
        "page-size": "A4",
        "margin-top": "10mm",
        "margin-right": "10mm",
        "margin-bottom": "10mm",
        "margin-left": "10mm",
    }
    return pdfkit.from_string(full, False, configuration=PDFKIT_CONFIG, options=options)

def download_questions_pdf(ex: Exercise) -> bytes:
    return _render_pdf(format_questions_html(ex.prompt))

def download_answers_pdf(ex: Exercise) -> bytes:
    return _render_pdf(format_answers_html(ex.answers))

def assign_homework(exercise_id: int) -> Homework:
    """
    创建一条 Homework 并手动加载 exercise 关系
    """
    with Session(engine) as sess:
        # 1) 创建并提交
        hw = Homework(exercise_id=exercise_id)
        sess.add(hw)
        sess.commit()
        sess.refresh(hw)
        # 2) 手动加载 exercise 对象
        ex = sess.get(Exercise, exercise_id)
        hw.exercise = ex
        return hw

def list_homeworks() -> List[Homework]:
    """
    查询所有 Homework 并手动加载 exercise 关系
    """
    with Session(engine) as sess:
        hws = sess.exec(
            select(Homework).order_by(Homework.assigned_at)
        ).all()
        for hw in hws:
            hw.exercise = sess.get(Exercise, hw.exercise_id)
        return hws

def submit_homework(homework_id: int, student_id: int, answers: dict) -> Submission:
    with Session(engine) as sess:
        sub = Submission(
            homework_id=homework_id,
            student_id=student_id,
            answers=answers,
            # 立即计算分数
            score=sum(
                1
                for qid, ans in answers.items()
                if sess.get(Exercise, sess.get(Homework, homework_id).exercise_id)
                   .answers.get(str(qid)) == ans
            )
        )
        sess.add(sub)
        sess.commit()
        sess.refresh(sub)
        return sub

def stats_for_exercise(exercise_id: int) -> Dict[str, Any]:
    with Session(engine) as sess:
        subs = []
        for hw in sess.exec(
            select(Homework).where(Homework.exercise_id == exercise_id)
        ):
            subs += sess.exec(
                select(Submission).where(Submission.homework_id == hw.id)
            ).all()
        total = len(subs)
        average = sum(s.score for s in subs) / total if total else 0
        return {"total_submissions": total, "average_score": average}
