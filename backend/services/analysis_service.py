import json
import re
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
        "请根据以下学生的练习情况给出学习分析，并使用JSON格式输出，"
        "需包含analysis(文字描述)、weak_points(数组)以及recommendation(对象，"
        "含topic、num_single_choice、num_multiple_choice、num_fill_blank、"
        "num_short_answer、num_programming)：\n"
        f"{json.dumps(summary, ensure_ascii=False)}"
    )
    try:
        resp = call_deepseek_api(prompt)
        content = resp["choices"][0]["message"]["content"]
        text = re.sub(r"^```(?:json)?\s*", "", content)
        text = re.sub(r"\s*```$", "", text)
        data = json.loads(text)
    except Exception as e:
        data = {
            "analysis": f"分析失败: {e}",
            "weak_points": [],
            "recommendation": {},
        }
    return data


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
        "你是一名专业的学情分析师，请根据以下学生的作业情况（每份作业的满分、得分以及错题）给出详细的学习分析。"
        "使用JSON格式返回，需包含analysis(文字描述)、weak_points(数组)以及"
        "recommendation(对象，含topic、num_single_choice、num_multiple_choice、"
        "num_fill_blank、num_short_answer、num_programming)：\n"
        f"{json.dumps(summary, ensure_ascii=False)}"
    )
    try:
        resp = call_deepseek_api(prompt)
        content = resp["choices"][0]["message"]["content"]
        text = re.sub(r"^```(?:json)?\s*", "", content)
        text = re.sub(r"\s*```$", "", text)
        data = json.loads(text)
    except Exception as e:
        data = {
            "analysis": f"分析失败: {e}",
            "weak_points": [],
            "recommendation": {},
        }
    return data


def analyze_and_save_homeworks(student_id: int, teacher_id: Optional[int] = None) -> str:
    result = analyze_student_homeworks(student_id, teacher_id)
    with Session(engine) as sess:
        sa = StudentAnalysis(
            student_id=student_id,
            teacher_id=teacher_id,
            content=json.dumps(result, ensure_ascii=False),
        )
        sess.add(sa)
        sess.commit()
    return result["analysis"]


def get_latest_analysis(
    student_id: int, teacher_id: Optional[int] = None
) -> Optional[Dict[str, Any]]:
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
        if not sa:
            return None
        try:
            return json.loads(sa.content)
        except Exception:
            return {"analysis": sa.content}
