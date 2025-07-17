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

        # —— 新增：只处理单选/多选题的索引->字母转换 ——
        def convert_indexed_answers(prompt_blocks, indexed_answers: Dict[str, Any]) -> Dict[str, Any]:
            """
            只对 single_choice / multiple_choice 题型做索引->字母转换，
            其他题型保持原值。
            """
            # 构造 qid -> (qtype, options) 映射
            meta = {}
            for block in prompt_blocks:
                qtype = block.get("type")
                for item in block.get("items", []):
                    qid = str(item.get("id"))
                    meta[qid] = {
                        "type": qtype,
                        "options": item.get("options", []),
                    }

            letter_answers = {}
            for qid, ans in indexed_answers.items():
                info = meta.get(qid)
                # 如果不是选择题或未找到元数据，保持原值
                if not info or info["type"] not in ("single_choice", "multiple_choice"):
                    letter_answers[qid] = ans
                    continue

                opts = info["options"]
                if isinstance(ans, list):
                    # 多选题：索引列表 -> 字母列表
                    letter_answers[qid] = [
                        opts[i].split(".", 1)[0] for i in ans if 0 <= i < len(opts)
                    ]
                else:
                    # 单选题：单个索引 -> 字母
                    letter_answers[qid] = (
                        opts[ans].split(".", 1)[0]
                        if isinstance(ans, int) and 0 <= ans < len(opts)
                        else ans
                    )
            return letter_answers

        # 原始索引答案
        indexed = sub.answers or {}
        # 转换得到字母答案（只影响 single_choice/multiple_choice 题型）
        letter_answers = convert_indexed_answers(ex.prompt, indexed)

        # 构建批改 prompt（用 letter_answers 而非原始 sub.answers）
        point_map = ex.points or {}
        sa_point = point_map.get("short_answer", 1)
        prompt = (
            "请根据下面的 JSON：\n"
            f"题目: {json.dumps(ex.prompt, ensure_ascii=False)}\n"
            f"标准答案: {json.dumps(ex.answers, ensure_ascii=False)}\n"
            f"学生答案: {json.dumps(letter_answers, ensure_ascii=False)}\n\n"
            f"请判断学生答案并给出解析。其中简答题按照满分 {sa_point} 分给出 0 到 {sa_point} 的得分，"
            "其他题型判断对错即可。"
            "返回 JSON：{ \"results\": {qid: 'correct|wrong|partial'}, \"scores\": {qid: number}, "
            "\"explanations\": {qid: '解析'} }。"
            "请只返回 JSON，不要有其它任何多余内容，包括任何markdown符号。"
        )

        # 调用 Deepseek / 大模型 API
        resp = call_deepseek_api(prompt, model="deepseek-chat")
        content = resp["choices"][0]["message"]["content"]

        # 提取 JSON 字符串
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or start > end:
            # fallback: 去除可能存在的 ```json ``` 标记
            text = re.sub(r"^```(?:json)?\s*", "", content)
            text = re.sub(r"\s*```$", "", text)
        else:
            text = content[start : end + 1]

        data = json.loads(text)
        results      = data.get("results", {})
        explanations = data.get("explanations", {})
        scores_dict  = data.get("scores", {})

        # 计算总分
        total_score = 0
        # 构建 qid->题型映射
        qtype_map = {}
        for block in ex.prompt:
            for item in block.get("items", []):
                qtype_map[str(item.get("id"))] = block.get("type")

        for qid, result in results.items():
            base = point_map.get(qtype_map.get(str(qid), ""), 1)
            if str(qid) in scores_dict:
                try:
                    total_score += float(scores_dict[str(qid)])
                except ValueError:
                    pass
            else:
                if result in ("correct", "正确", True):
                    total_score += base

        sub.score    = int(round(total_score))
        sub.feedback = {
            "results": results,
            "explanations": explanations,
            "scores": scores_dict,
        }
        sub.status   = "completed"

        sess.add(sub)
        sess.commit()

        # 批改后触发分析
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
