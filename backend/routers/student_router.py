from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from backend.auth import get_current_user
from backend.models import User
from backend.schemas.student_schema import (
    AskRequest, ChatOut, PracticeGenerateRequest, PracticeOut, PracticeSubmitRequest
)
from backend.services.chat_service import ask_question, list_history
from backend.services.practice_service import (
    generate_practice, list_practices, get_practice, submit_practice
)

router = APIRouter(prefix="/student/ai", tags=["student-ai"])

@router.post("/ask", response_model=ChatOut)
def api_ask(req: AskRequest, user: User = Depends(get_current_user)):
    chat = ask_question(user.id, req.question)
    return ChatOut(id=chat.id, question=chat.question, answer=chat.answer, created_at=chat.created_at)

@router.get("/history", response_model=List[ChatOut])
def api_history(user: User = Depends(get_current_user)):
    chats = list_history(user.id)
    return [ChatOut(id=c.id, question=c.question, answer=c.answer, created_at=c.created_at) for c in chats]

router_practice = APIRouter(prefix="/student/practice", tags=["student-practice"])

@router_practice.post("/generate", response_model=PracticeOut)
def api_generate(req: PracticeGenerateRequest, user: User = Depends(get_current_user)):
    pr = generate_practice(user.id, req.requirement)
    return PracticeOut(
        id=pr.id,
        topic=pr.topic,
        questions=pr.questions,
        answers=pr.answers,
        status=pr.status,
    )

@router_practice.get("/list", response_model=List[PracticeOut])
def api_list(user: User = Depends(get_current_user)):
    prs = list_practices(user.id)
    out = []
    for pr in prs:
        out.append(PracticeOut(id=pr.id, topic=pr.topic, questions=pr.questions, answers=pr.answers, status=pr.status))
    return out

@router_practice.post("/{pid}/submit", response_model=PracticeOut)
def api_submit(pid: int, req: PracticeSubmitRequest, user: User = Depends(get_current_user)):
    pr = submit_practice(pid, user.id, req.answers)
    if not pr:
        raise HTTPException(404, "practice not found")
    return PracticeOut(id=pr.id, topic=pr.topic, questions=pr.questions, answers=pr.answers, status=pr.status, feedback=pr.feedback, score=pr.score)

