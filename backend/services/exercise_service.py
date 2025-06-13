# backend/services/exercise_service.py

import json
import re
from typing import Dict, Any, List
from sqlmodel import Session, select
from backend.models import Exercise, Homework
from backend.utils.deepseek_client import call_deepseek_api
from backend.config import engine

def _parse_model_response(resp: Dict[str, Any]) -> Dict[str, Any]:
    content: str = resp["choices"][0]["message"]["content"]
    text = re.sub(r"^```(?:json)?\s*", "", content)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)

def preview_exercise(
    topic: str,
    num_mcq: int,
    num_fill_blank: int,
    num_short_answer: int,
    num_programming: int,
) -> Dict[str, Any]:
    """
    调用大模型生成练习，不写库，返回 {topic, questions, answers}。
    """
    parts = []
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
        "请以 JSON 格式返回：questions（列表，每项 {\"type\":..., \"items\":[...] }），"
        "answers（对象，键为题目 id，值为参考答案）。"
    )
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

def download_questions_pdf(ex: Exercise) -> bytes:
    raise NotImplementedError  # 留空或引用已有 PDF 渲染工具

def download_answers_pdf(ex: Exercise) -> bytes:
    raise NotImplementedError

def assign_homework(exercise_id: int) -> Homework:
    with Session(engine) as sess:
        hw = Homework(exercise_id=exercise_id)
        sess.add(hw)
        sess.commit()
        sess.refresh(hw)
        return hw

def stats_for_exercise(exercise_id: int) -> Dict[str, Any]:
    from backend.models import Submission
    with Session(engine) as sess:
        subs = sess.exec(select(Submission).where(Submission.homework_id == Homework.id)).all()
        total = len(subs)
        avg = sum(s.score for s in subs) / total if total else 0
        return {"total_submissions": total, "average_score": avg}
