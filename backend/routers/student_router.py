from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from backend.auth import get_current_user
from backend.models import User
from backend.schemas.student_schema import (
    AskRequest,
    ChatOut,
    SessionOut,
    MessageOut,
    PracticeGenerateRequest,
    PracticeOut,
    PracticeSubmitRequest,
)
from backend.services.chat_service import (
    ask_question,
    list_history,
    create_session,
    list_sessions,
    get_messages,
    ask_in_session,
    delete_session,
)
from backend.services.practice_service import (
    generate_practice, list_practices, get_practice, submit_practice,
    download_practice_pdf
)
from fastapi.responses import StreamingResponse
from urllib.parse import quote
import io

router = APIRouter(prefix="/student/ai", tags=["student-ai"])

@router.post("/ask", response_model=ChatOut)
def api_ask(req: AskRequest, user: User = Depends(get_current_user)):
    chat = ask_question(user.id, req.question)
    return ChatOut(id=chat.id, question=chat.question, answer=chat.answer, created_at=chat.created_at)

@router.get("/history", response_model=List[ChatOut])
def api_history(user: User = Depends(get_current_user)):
    chats = list_history(user.id)
    return [ChatOut(id=c.id, question=c.question, answer=c.answer, created_at=c.created_at) for c in chats]


@router.post("/session", response_model=SessionOut)
def api_create_session(user: User = Depends(get_current_user)):
    session = create_session(user.id)
    return SessionOut(id=session.id, title=session.title, created_at=session.created_at)


@router.get("/sessions", response_model=List[SessionOut])
def api_list_sessions(user: User = Depends(get_current_user)):
    sessions = list_sessions(user.id)
    return [SessionOut(id=s.id, title=s.title, created_at=s.created_at) for s in sessions]


@router.get("/session/{sid}", response_model=List[MessageOut])
def api_get_messages(sid: int, user: User = Depends(get_current_user)):
    msgs = get_messages(user.id, sid)
    return [MessageOut(id=m.id, session_id=m.session_id, role=m.role, content=m.content, created_at=m.created_at) for m in msgs]


@router.post("/session/{sid}/ask", response_model=MessageOut)
def api_ask_in_session(sid: int, req: AskRequest, user: User = Depends(get_current_user)):
    msg = ask_in_session(user.id, sid, req.question)
    return MessageOut(id=msg.id, session_id=msg.session_id, role=msg.role, content=msg.content, created_at=msg.created_at)


@router.delete("/session/{sid}")
def api_delete_session(sid: int, user: User = Depends(get_current_user)):
    ok = delete_session(user.id, sid)
    if not ok:
        raise HTTPException(404, "session not found")
    return {"status": "ok"}



router_practice = APIRouter(prefix="/student/self_practice", tags=["student-self_practice"])

@router_practice.post("/generate", response_model=PracticeOut)
def api_generate(req: PracticeGenerateRequest, user: User = Depends(get_current_user)):
    pr = generate_practice(
        user.id,
        topic=req.topic,
        num_single_choice=req.num_single_choice,
        num_multiple_choice=req.num_multiple_choice,
        num_fill_blank=req.num_fill_blank,
        num_short_answer=req.num_short_answer,
        num_programming=req.num_programming,
    )
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

@router_practice.get("/{pid}", response_model=PracticeOut)
def api_detail(pid: int, user: User = Depends(get_current_user)):
    pr = get_practice(pid, user.id)
    if not pr:
        raise HTTPException(404, "self practice not found")
    return PracticeOut(id=pr.id, topic=pr.topic, questions=pr.questions, answers=pr.answers, status=pr.status)

@router_practice.get("/{pid}/download", response_class=StreamingResponse)
def api_download(pid: int, user: User = Depends(get_current_user)):
    pr = get_practice(pid, user.id)
    if not pr:
        raise HTTPException(404, "self practice not found")
    pdf_bytes = download_practice_pdf(pr)
    raw_name = f"self_practice_{pid}.pdf"
    fallback = "self_practice.pdf"
    quoted = quote(raw_name, safe="")
    headers = {"Content-Disposition": f"attachment; filename={fallback}; filename*=UTF-8''{quoted}"}
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)

@router_practice.post("/{pid}/submit", response_model=PracticeOut)
def api_submit(pid: int, req: PracticeSubmitRequest, user: User = Depends(get_current_user)):
    pr = submit_practice(pid, user.id, req.answers)
    if not pr:
        raise HTTPException(404, "self practice not found")
    return PracticeOut(id=pr.id, topic=pr.topic, questions=pr.questions, answers=pr.answers, status=pr.status, feedback=pr.feedback, score=pr.score)


from backend.services.analysis_service import get_latest_analysis

router_analysis = APIRouter(prefix="/student", tags=["student-analysis"])

@router_analysis.get("/analysis")
def api_analysis(user: User = Depends(get_current_user)):
    content = get_latest_analysis(user.id)
    return {"analysis": content or ""}
