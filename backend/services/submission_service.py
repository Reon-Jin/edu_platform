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
        point_map = ex.points or {}
        sa_point = point_map.get("short_answer", 1)
        prompt = (
            "请根据下面的 JSON：\n"
            f"题目: {json.dumps(ex.prompt, ensure_ascii=False)}\n"
            f"标准答案: {json.dumps(ex.answers, ensure_ascii=False)}\n"
            f"学生答案: {json.dumps(sub.answers, ensure_ascii=False)}\n\n"
            f"请判断学生答案并给出解析。其中简答题按照满分 {sa_point} 分给出 0 到 {sa_point} 的得分，其他题型判断对错即可。"
            "返回 JSON：{ \"results\": {qid: 'correct|wrong|partial'}, \"scores\": {qid: number}, \"explanations\": {qid: '解析'} }"
        )
        resp = call_deepseek_api(prompt, model="deepseek-reasoner")
        content = resp["choices"][0]["message"]["content"]
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or start > end:
            # fallback: remove Markdown fences if any
            text = re.sub(r"^```(?:json)?\s*", "", content)
            text = re.sub(r"\s*```$", "", text)
        else:
            text = content[start : end + 1]
        data = json.loads(text)

        results      = data.get("results", {})
        explanations = data.get("explanations", {})
        scores_dict  = data.get("scores", {})

        # 计算得分，考虑题型分值
        score = 0
        point_map = ex.points or {}
        qtype_map = {}
        for block in ex.prompt:
            for item in block.get("items", []):
                qtype_map[str(item.get("id"))] = block.get("type")

        for qid, result in results.items():
            base = point_map.get(qtype_map.get(str(qid), ""), 1)
            if str(qid) in scores_dict:
                try:
                    score += float(scores_dict[str(qid)])
                except Exception:
                    score += 0
            else:
                if result in ("correct", "正确", True):
                    score += base

        sub.score    = int(round(score))
        sub.feedback = {
            "results": results,
            "explanations": explanations,
            "scores": scores_dict,
        }
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
    student_id: int, class_id: Optional[int] = None
) -> List[Submission]:
    """Return completed submissions for a student (optionally filtered by class)."""
    with Session(engine) as sess:
        stmt = (
            select(Submission)
            .join(Homework, Submission.homework_id == Homework.id)
            .where(
                Submission.student_id == student_id,
                Submission.status == "completed",
            )
            .order_by(Submission.submitted_at)
        )
        if class_id is not None:
            stmt = stmt.where(Homework.class_id == class_id)
        subs = sess.exec(stmt).all()
        for sub in subs:
            hw = sess.get(Homework, sub.homework_id)
            ex = sess.get(Exercise, hw.exercise_id)
            hw.exercise = ex
            sub.homework = hw
        return subs
