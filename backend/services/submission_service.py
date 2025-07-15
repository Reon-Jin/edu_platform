# backend/services/submission_service.py

import json
import re
from typing import Dict, Any, List, Optional
from sqlmodel import Session, select
from backend.config import engine
from backend.models import Exercise, Homework, Submission, ClassStudent, Class
from backend.utils.deepseek_client import call_deepseek_api
from backend.services.analysis_service import analyze_and_save_homeworks

def submit_homework(homework_id: int, student_id: int, answers: Dict[str, Any]) -> Submission:
    """
    存一条新提交，status=grading，异步批改
    """
    with Session(engine) as sess:
        sub = Submission(
            homework_id=homework_id,
            student_id=student_id,
            answers=answers,
            status="grading"
        )
        sess.add(sub)
        sess.commit()
        sess.refresh(sub)
        return sub

def grade_submission(submission_id: int):
    """
    后台批改：调用大模型，比对标准答案，填充 score、feedback、status=completed。
    """
    with Session(engine) as sess:
        sub = sess.get(Submission, submission_id)
        hw  = sess.get(Homework, sub.homework_id)
        ex  = sess.get(Exercise, hw.exercise_id)

        # 构建批改 prompt
        prompt = (
            "请根据下面的 JSON：\n"
            f"题目: {json.dumps(ex.prompt, ensure_ascii=False)}\n"
            f"标准答案: {json.dumps(ex.answers, ensure_ascii=False)}\n"
            f"学生答案: {json.dumps(sub.answers, ensure_ascii=False)}\n\n"
            "对每道题给出结果和解析，以 JSON 格式返回：\n"
            "{ \"results\": {\"qid\":\"correct|wrong\", ...}, "
            "\"explanations\": {\"qid\":\"解析文本\", ...} }"
        )
        resp = call_deepseek_api(prompt, model="deepseek-reasoner")
        content = resp["choices"][0]["message"]["content"]
        # 去除 Markdown code fence
        text = re.sub(r"^```(?:json)?\s*", "", content)
        text = re.sub(r"\s*```$", "", text)
        data = json.loads(text)

        results     = data.get("results", {})
        explanations= data.get("explanations", {})
        # 计算得分
        score = sum(1 for v in results.values() if v in ("correct", "正确", True))

        sub.score    = score
        sub.feedback = {"results": results, "explanations": explanations}
        sub.status   = "completed"

        sess.add(sub)
        sess.commit()

        # after grading, trigger student analysis
        analyze_and_save_homeworks(sub.student_id)
        cls = sess.get(Class, hw.class_id) if hw.class_id else None
        if cls and cls.teacher_id == ex.teacher_id:
            analyze_and_save_homeworks(sub.student_id, teacher_id=cls.teacher_id)

def list_student_homeworks(student_id: int) -> List[Dict[str, Any]]:
    """
    列出所有作业及当前学生提交状态
    """
    out = []
    with Session(engine) as sess:
        hws = sess.exec(select(Homework).order_by(Homework.assigned_at)).all()
        for hw in hws:
            if hw.class_id is not None:
                link = sess.get(ClassStudent, (hw.class_id, student_id))
                if not link:
                    continue
            sub = (
                sess.exec(
                    select(Submission)
                    .where(
                        Submission.homework_id == hw.id,
                        Submission.student_id == student_id,
                    )
                    .order_by(Submission.submitted_at.desc())
                ).first()
            )

            answers_empty = not sub or not sub.answers or all(
                v in (None, "", []) for v in getattr(sub, "answers", {}).values()
            )

            if answers_empty:
                status, sid = "not_submitted", None
            else:
                status, sid = sub.status, sub.id

            ex = sess.get(Exercise, hw.exercise_id)

            out.append({
                "homework_id": hw.id,
                "exercise_id": hw.exercise_id,
                "assigned_at": hw.assigned_at,
                "status": status,
                "submission_id": sid,
                "subject": ex.subject if ex else None,
            })
    return out


def get_homework_exercise(hw_id: int) -> Optional[Exercise]:
    """根据作业ID获取练习内容"""
    with Session(engine) as sess:
        hw = sess.get(Homework, hw_id)
        if not hw:
            return None
        return sess.get(Exercise, hw.exercise_id)

def get_submission_by_hw_student(homework_id: int, student_id: int) -> Optional[Submission]:
    """
    获取某学生对某作业的提交，并预先加载 homework 和 exercise，
    以避免 DetachedInstanceError。
    """
    with Session(engine) as sess:
        # 1. 获取 Submission
        sub = sess.exec(
            select(Submission)
            .where(
                Submission.homework_id == homework_id,
                Submission.student_id  == student_id
            )
        ).first()
        if not sub:
            return None

        # 2. 手动加载关联的 Homework
        hw = sess.get(Homework, homework_id)
        # 3. 再加载关联的 Exercise
        ex = sess.get(Exercise, hw.exercise_id)

        # 4. 挂载到对象上
        hw.exercise    = ex
        sub.homework   = hw

        return sub


def list_completed_submissions(
    student_id: int,
    teacher_id: int | None = None,
    class_id: int | None = None,
) -> List[Submission]:
    """Return completed submissions for a student filtered by teacher/class."""
    with Session(engine) as sess:
        stmt = (
            select(Submission)
            .join(Homework, Submission.homework_id == Homework.id)
            .join(Exercise, Homework.exercise_id == Exercise.id)
            .where(
                Submission.student_id == student_id,
                Submission.status == "completed",
            )
            .order_by(Submission.submitted_at)
        )

        if teacher_id is not None:
            stmt = stmt.where(Exercise.teacher_id == teacher_id)
        if class_id is not None:
            stmt = stmt.where(Homework.class_id == class_id)

        subs = sess.exec(stmt).all()
        for sub in subs:
            hw = sess.get(Homework, sub.homework_id)
            ex = sess.get(Exercise, hw.exercise_id)
            hw.exercise = ex
            sub.homework = hw
        return subs
