import json
from typing import Dict, Any, Optional
from sqlmodel import Session, select

from backend.config import engine
from backend.models import Practice, Submission, Homework, Exercise, StudentAnalysis
from backend.utils.deepseek_client import call_deepseek_api
from backend.utils.scoring import compute_total_points


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


def _collect_homework_summary(
    student_id: int,
    teacher_id: Optional[int] = None,
    class_id: Optional[int] = None,
) -> list[dict[str, Any]]:
    """Return a list of homework summary dicts."""
    with Session(engine) as sess:
        stmt = (
            select(Submission, Exercise)
            .join(Homework, Submission.homework_id == Homework.id)
            .join(Exercise, Homework.exercise_id == Exercise.id)
            .where(
                Submission.student_id == student_id,
                Submission.status == "completed",
            )
        )
        if teacher_id is not None:
            stmt = stmt.where(Exercise.teacher_id == teacher_id)
        if class_id is not None:
            stmt = stmt.where(Homework.class_id == class_id)
        rows = sess.exec(stmt).all()
        summary = []
        for sub, ex in rows:
            total = compute_total_points(ex)
            wrong = []
            if isinstance(sub.feedback, dict):
                results = sub.feedback.get("results", {})
                # 构建题号->题干映射
                qmap = {}
                for block in ex.prompt:
                    for item in block.get("items", []):
                        qmap[str(item.get("id"))] = item.get("question")
                for qid, r in results.items():
                    if r not in ("correct", "正确", True):
                        wrong.append(qmap.get(str(qid), str(qid)))
            summary.append({
                "subject": ex.subject,
                "total": total,
                "score": sub.score,
                "wrong_questions": wrong,
            })
        return summary


def analyze_student_homeworks(
    student_id: int,
    teacher_id: Optional[int] = None,
    class_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Analyze student's completed homework submissions."""
    summary = _collect_homework_summary(student_id, teacher_id, class_id)
    prompt = (
        "根据以下学生的作业情况（每份作业的满分、得分以及错题）给出学习情况分析，并给出学习建议：\n"
        f"{json.dumps(summary, ensure_ascii=False)}"
    )
    try:
        resp = call_deepseek_api(prompt)
        content = resp["choices"][0]["message"]["content"]
    except Exception as e:
        content = f"分析失败: {e}"
    return {"analysis": content}


def analyze_and_save_homeworks(student_id: int, teacher_id: Optional[int] = None) -> str:
    result = analyze_student_homeworks(student_id, teacher_id)
    with Session(engine) as sess:
        sa = StudentAnalysis(student_id=student_id, teacher_id=teacher_id, content=result["analysis"])
        sess.add(sa)
        sess.commit()
    return result["analysis"]


def get_latest_analysis(student_id: int, teacher_id: Optional[int] = None) -> Optional[str]:
    with Session(engine) as sess:
        stmt = (
            select(StudentAnalysis)
            .where(StudentAnalysis.student_id == student_id)
            .order_by(StudentAnalysis.created_at.desc())
        )
        if teacher_id is not None:
            stmt = stmt.where(StudentAnalysis.teacher_id == teacher_id)
        else:
            stmt = stmt.where(StudentAnalysis.teacher_id.is_(None))
        sa = sess.exec(stmt).first()
        return sa.content if sa else None
