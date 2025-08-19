from typing import List, Iterator
from sqlmodel import Session, select
from sqlalchemy import func
from backend.config import engine
from backend.models import ChatHistory, ChatSession, ChatMessage, Class, ClassStudent
from backend.utils.deepseek_client import call_deepseek_api, call_deepseek_api_chat
from backend.utils.rag_pipeline import retrieve_paragraphs
from datetime import datetime

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


def create_session(student_id: int) -> ChatSession:
    """Create a new chat session for a student.

    The title is assigned based on the number of existing sessions so that
    the front end can display sequentially numbered history entries.
    """
    with Session(engine) as sess:
        count = sess.exec(
            select(func.count()).select_from(ChatSession).where(ChatSession.student_id == student_id)
        ).one()
        title = f"对话{count + 1}"
        session = ChatSession(student_id=student_id, title=title)
        sess.add(session)
        sess.commit()
        sess.refresh(session)
        return session


def list_sessions(student_id: int) -> List[ChatSession]:
    with Session(engine) as sess:
        stmt = select(ChatSession).where(ChatSession.student_id == student_id).order_by(ChatSession.created_at.desc())
        return sess.exec(stmt).all()


def get_messages(student_id: int, session_id: int) -> List[ChatMessage]:
    with Session(engine) as sess:
        session = sess.get(ChatSession, session_id)
        if not session or session.student_id != student_id:
            return []
        stmt = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)
        return sess.exec(stmt).all()


def ask_in_session(
    student_id: int, session_id: int, question: str, use_docs: bool = False
) -> ChatMessage:
    with Session(engine) as sess:
        session = sess.get(ChatSession, session_id)
        if not session or session.student_id != student_id:
            raise ValueError("session not found")
        user_msg = ChatMessage(session_id=session_id, role="user", content=question)
        sess.add(user_msg)
        sess.commit()
        msgs = sess.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        ).all()
        conv = [{"role": m.role, "content": m.content} for m in msgs]

        system_prompt = "你是学生的AI教师，请以此身份帮助学生。"
        if use_docs:
            teacher_id = sess.exec(
                select(Class.teacher_id)
                .join(ClassStudent, Class.id == ClassStudent.class_id)
                .where(ClassStudent.student_id == student_id)
            ).first()
            if teacher_id:
                snippets = retrieve_paragraphs(
                    question, teacher_id, sess, top_k=5, include_inactive=True
                )
                if snippets:
                    refs = "\n".join(f"- {text}" for _, text in snippets)
                    system_prompt += f"\n\n以下是教师提供的资料：\n{refs}"

        conv.insert(0, {"role": "system", "content": system_prompt})
        resp = call_deepseek_api_chat(conv)
        answer = resp["choices"][0]["message"]["content"]
        ai_msg = ChatMessage(session_id=session_id, role="assistant", content=answer)
        sess.add(ai_msg)
        sess.commit()
        sess.refresh(ai_msg)
        return ai_msg


def ask_in_session_stream(
    student_id: int,
    session_id: int,
    question: str,
    use_docs: bool = False,
) -> Iterator[str]:
    """Ask a question in a session and yield the answer token by token."""
    with Session(engine) as sess:
        session = sess.get(ChatSession, session_id)
        if not session or session.student_id != student_id:
            raise ValueError("session not found")
        user_msg = ChatMessage(session_id=session_id, role="user", content=question)
        sess.add(user_msg)
        sess.commit()
        msgs = (
            sess.exec(
                select(ChatMessage)
                .where(ChatMessage.session_id == session_id)
                .order_by(ChatMessage.created_at)
            ).all()
        )
        conv = [{"role": m.role, "content": m.content} for m in msgs]

        system_prompt = "你是学生的AI教师，请以此身份帮助学生。"
        if use_docs:
            teacher_id = sess.exec(
                select(Class.teacher_id)
                .join(ClassStudent, Class.id == ClassStudent.class_id)
                .where(ClassStudent.student_id == student_id)
            ).first()
            if teacher_id:
                snippets = retrieve_paragraphs(
                    question, teacher_id, sess, top_k=5, include_inactive=True
                )
                if snippets:
                    refs = "\n".join(f"- {text}" for _, text in snippets)
                    system_prompt += f"\n\n以下是教师提供的资料：\n{refs}"

        conv.insert(0, {"role": "system", "content": system_prompt})
        resp = call_deepseek_api_chat(conv)
        answer = resp["choices"][0]["message"]["content"]
        ai_msg = ChatMessage(session_id=session_id, role="assistant", content=answer)
        sess.add(ai_msg)
        sess.commit()

    def token_gen() -> Iterator[str]:
        for ch in answer:
            yield ch

    return token_gen()


def delete_session(student_id: int, session_id: int) -> bool:
    """Delete chat session and its messages"""
    with Session(engine) as sess:
        session = sess.get(ChatSession, session_id)
        if not session or session.student_id != student_id:
            return False
        msgs = sess.exec(select(ChatMessage).where(ChatMessage.session_id == session_id)).all()
        for m in msgs:
            sess.delete(m)
        sess.delete(session)
        sess.commit()
        return True


