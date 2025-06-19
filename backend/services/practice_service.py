import json
import re
from typing import Dict, Any, List
from sqlmodel import Session, select
from backend.config import engine
from backend.models import Practice
from backend.utils.deepseek_client import call_deepseek_api
from backend.services.exercise_service import _build_pdf
from io import BytesIO


def _parse_model_response(resp: Dict[str, Any]) -> Dict[str, Any]:
    content: str = resp["choices"][0]["message"]["content"]
    text = re.sub(r"^```(?:json)?\s*", "", content)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def generate_practice(student_id: int, requirement: str) -> Practice:
    prompt = (
        f"请根据以下要求生成练习题，并返回 JSON：{requirement}\n"
        "{\"questions\":[], \"answers\":{}}"
    )
    resp = call_deepseek_api(prompt)
    data = _parse_model_response(resp)
    with Session(engine) as sess:
        practice = Practice(
            student_id=student_id,
            topic=requirement,
            questions=data.get("questions", []),
            answers=data.get("answers", {}),
        )
        sess.add(practice)
        sess.commit()
        sess.refresh(practice)
        return practice


def list_practices(student_id: int) -> List[Practice]:
    with Session(engine) as sess:
        stmt = select(Practice).where(Practice.student_id == student_id).order_by(Practice.created_at.desc())
        return sess.exec(stmt).all()


def get_practice(practice_id: int, student_id: int) -> Practice | None:
    with Session(engine) as sess:
        pr = sess.get(Practice, practice_id)
        if pr and pr.student_id == student_id:
            return pr
        return None


def submit_practice(practice_id: int, student_id: int, answers: Dict[str, Any]) -> Practice:
    with Session(engine) as sess:
        pr = sess.get(Practice, practice_id)
        if not pr or pr.student_id != student_id:
            return None
        pr.student_answers = answers
        # simple grading by comparing
        results = {k: (answers.get(k) == pr.answers.get(k)) for k in pr.answers.keys()}
        pr.feedback = {"results": results}
        pr.score = sum(1 for v in results.values() if v)
        pr.status = "completed"
        sess.add(pr)
        sess.commit()
        sess.refresh(pr)
        return pr


def download_practice_pdf(pr: Practice) -> bytes:
    """Generate a PDF containing questions and answers for the practice."""
    buffer = BytesIO()
    _build_pdf(buffer, f"自定义随练 #{pr.id}", pr.questions or [], answers=pr.answers or {})
    return buffer.getvalue()
