from typing import List
from sqlmodel import Session, select
from backend.config import engine
from backend.models import ChatHistory
from backend.utils.deepseek_client import call_deepseek_api

def ask_question(student_id: int, question: str) -> ChatHistory:
    resp = call_deepseek_api(question)
    answer = resp["choices"][0]["message"]["content"]
    with Session(engine) as sess:
        chat = ChatHistory(student_id=student_id, question=question, answer=answer)
        sess.add(chat)
        sess.commit()
        sess.refresh(chat)
        return chat

def list_history(student_id: int) -> List[ChatHistory]:
    with Session(engine) as sess:
        stmt = select(ChatHistory).where(ChatHistory.student_id == student_id).order_by(ChatHistory.created_at.desc())
        return sess.exec(stmt).all()
