from datetime import datetime, timedelta
from typing import List, Optional
import io
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from sqlalchemy import func
from pydantic import BaseModel

from backend.auth import get_current_user
from backend.config import engine
from backend.routers.lesson_router import _generate_and_store_pdf
from backend.models import (
    User, Role, Courseware, Exercise, Homework, Submission,
    ChatHistory, ChatSession, ChatMessage, Practice, LoginEvent
)

router = APIRouter(prefix="/admin", tags=["admin"])


class UserInfo(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class CoursewareMeta(BaseModel):
    id: int
    topic: str
    teacher_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CoursewarePreview(BaseModel):
    id: int
    topic: str
    teacher_id: int
    markdown: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/users", response_model=List[UserInfo])
def list_users(role: Optional[str] = None, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        stmt = select(User, Role).join(Role, User.role_id == Role.id)
        if role:
            stmt = stmt.where(Role.name == role)
        rows = sess.exec(stmt).all()
        return [UserInfo(id=u.id, username=u.username, role=r.name) for u, r in rows]


@router.get("/users/{uid}", response_model=UserInfo)
def get_user(uid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        user = sess.get(User, uid)
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        role = sess.get(Role, user.role_id)
        rname = role.name if role else ""
        return UserInfo(id=user.id, username=user.username, role=rname)


@router.delete("/users/{uid}")
def delete_user(uid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        user = sess.get(User, uid)
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        # 删除与用户相关的记录
        for cw in sess.exec(select(Courseware).where(Courseware.teacher_id == uid)):
            sess.delete(cw)
        for ex in sess.exec(select(Exercise).where(Exercise.teacher_id == uid)):
            # 删除作业及提交
            for hw in sess.exec(select(Homework).where(Homework.exercise_id == ex.id)):
                for sub in sess.exec(select(Submission).where(Submission.homework_id == hw.id)):
                    sess.delete(sub)
                sess.delete(hw)
            sess.delete(ex)
        for sub in sess.exec(select(Submission).where(Submission.student_id == uid)):
            sess.delete(sub)
        for ch in sess.exec(select(ChatHistory).where(ChatHistory.student_id == uid)):
            sess.delete(ch)
        for s in sess.exec(select(ChatSession).where(ChatSession.student_id == uid)):
            for m in sess.exec(select(ChatMessage).where(ChatMessage.session_id == s.id)):
                sess.delete(m)
            sess.delete(s)
        for p in sess.exec(select(Practice).where(Practice.student_id == uid)):
            sess.delete(p)
        sess.delete(user)
        sess.commit()
        return {"status": "ok"}


@router.get("/coursewares", response_model=List[CoursewareMeta])
def list_coursewares(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        stmt = select(Courseware)
        items = sess.exec(stmt).all()
        return [CoursewareMeta(id=c.id, topic=c.topic, teacher_id=c.teacher_id, created_at=c.created_at) for c in items]


@router.post("/courseware/{cid}/share")
def share_courseware(cid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        cw = sess.get(Courseware, cid)
        if not cw:
            raise HTTPException(404, "课件不存在")
        teachers = sess.exec(select(User).join(Role).where(Role.name == "teacher")).all()
        for t in teachers:
            topic = f"{cw.topic}-public"
            new_cw = Courseware(
                teacher_id=t.id,
                topic=topic,
                markdown=cw.markdown,
                pdf=cw.pdf
            )
            sess.add(new_cw)
        sess.commit()
        return {"status": "shared"}


@router.get("/courseware/{cid}/preview", response_model=CoursewarePreview)
def preview_courseware(cid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        cw = sess.get(Courseware, cid)
        if not cw:
            raise HTTPException(404, "课件不存在")
        return CoursewarePreview(id=cw.id, topic=cw.topic, teacher_id=cw.teacher_id, markdown=cw.markdown, created_at=cw.created_at)


@router.get("/courseware/{cid}/download")
def download_courseware(cid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        cw = sess.get(Courseware, cid)
        if not cw:
            raise HTTPException(404, "课件不存在")
        if not cw.pdf:
            _generate_and_store_pdf(cw.id, cw.markdown)
            sess.refresh(cw)
        raw_name = f"lesson_{cw.topic}.pdf"
        fallback = "lesson.pdf"
        quoted = quote(raw_name, safe="")
        headers = {"Content-Disposition": f"attachment; filename={fallback}; filename*=UTF-8''{quoted}"}
        return StreamingResponse(io.BytesIO(cw.pdf), media_type="application/pdf", headers=headers)


class CoursewareUpdate(BaseModel):
    markdown: str


@router.post("/courseware/{cid}/update", response_model=CoursewareMeta)
def update_courseware(cid: int, data: CoursewareUpdate, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    with Session(engine) as sess:
        cw = sess.get(Courseware, cid)
        if not cw:
            raise HTTPException(404, "课件不存在")
        cw.markdown = data.markdown
        cw.prep_start = cw.prep_start or datetime.utcnow()
        cw.prep_end = datetime.utcnow()
        sess.add(cw)
        sess.commit()
        _generate_and_store_pdf(cw.id, cw.markdown)
        return CoursewareMeta(id=cw.id, topic=cw.topic, teacher_id=cw.teacher_id, created_at=cw.created_at)


@router.get("/dashboard")
def dashboard(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    with Session(engine) as sess:
        teacher_count = sess.exec(
            select(func.count()).select_from(User).join(Role).where(Role.name == "teacher")
        ).one()
        student_count = sess.exec(
            select(func.count()).select_from(User).join(Role).where(Role.name == "student")
        ).one()
        cw_count = sess.exec(select(func.count()).select_from(Courseware)).one()
        ex_count = sess.exec(select(func.count()).select_from(Exercise)).one()
        teacher_today = sess.exec(
            select(func.count()).select_from(LoginEvent).join(User).join(Role)
            .where(Role.name == "teacher", LoginEvent.created_at >= today)
        ).one()
        student_today = sess.exec(
            select(func.count()).select_from(LoginEvent).join(User).join(Role)
            .where(Role.name == "student", LoginEvent.created_at >= today)
        ).one()
        teacher_week = sess.exec(
            select(func.count()).select_from(LoginEvent).join(User).join(Role)
            .where(Role.name == "teacher", LoginEvent.created_at >= week_ago)
        ).one()
        student_week = sess.exec(
            select(func.count()).select_from(LoginEvent).join(User).join(Role)
            .where(Role.name == "student", LoginEvent.created_at >= week_ago)
        ).one()

        rows = sess.exec(
            select(Courseware.prep_start, Courseware.prep_end)
            .where(Courseware.prep_start != None, Courseware.prep_end != None)
        ).all()
        durations = [ (e - s).total_seconds() for s, e in rows if e >= s ]
        efficiency = sum(durations) / len(durations) if durations else 0.0

    return {
        "teacher_count": teacher_count,
        "student_count": student_count,
        "courseware_count": cw_count,
        "exercise_count": ex_count,
        "teacher_usage_today": teacher_today,
        "student_usage_today": student_today,
        "teacher_usage_week": teacher_week,
        "student_usage_week": student_week,
        "teaching_efficiency": efficiency,
    }
