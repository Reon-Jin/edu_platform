import json
from typing import Dict, Any
from sqlmodel import Session, select

from backend.config import engine
from backend.models import Practice, Submission, Homework, Exercise
from backend.utils.deepseek_client import call_deepseek_api


def analyze_student_practice(student_id: int) -> Dict[str, Any]:
    """Analyze student practice history using deepseek model."""
    with Session(engine) as sess:
        practices = sess.exec(
            select(Practice).where(
                Practice.student_id == student_id, Practice.status == "completed"
            )
        ).all()
        summary = [
            {"topic": p.topic, "score": p.score, "status": p.status}
            for p in practices
        ]
    prompt = (
        "根据以下学生的练习情况给出学习情况分析，并给出学习建议：\n"
        f"{json.dumps(summary, ensure_ascii=False)}"
    )
    try:
        resp = call_deepseek_api(prompt)
        content = resp["choices"][0]["message"]["content"]
    except Exception as e:
        content = f"分析失败: {e}"
    return {"analysis": content}


def analyze_student_homeworks(student_id: int) -> Dict[str, Any]:
    """Analyze student's completed homework submissions."""
    with Session(engine) as sess:
        rows = sess.exec(
            select(Submission, Exercise)
            .join(Homework, Submission.homework_id == Homework.id)
            .join(Exercise, Homework.exercise_id == Exercise.id)
            .where(Submission.student_id == student_id, Submission.status == "completed")
        ).all()
        summary = [
            {"subject": ex.subject, "score": sub.score}
            for sub, ex in rows
        ]
    prompt = (
        "根据以下学生的作业成绩给出学习情况分析，并给出学习建议：\n"
        f"{json.dumps(summary, ensure_ascii=False)}"
    )
    try:
        resp = call_deepseek_api(prompt)
        content = resp["choices"][0]["message"]["content"]
    except Exception as e:
        content = f"分析失败: {e}"
    return {"analysis": content}
