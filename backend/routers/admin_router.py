from datetime import datetime, timedelta
from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from backend.auth import get_current_user
from backend.models import User, Courseware, Exercise, Submission, Practice
from backend.db import get_session

router = APIRouter(prefix="/admin", tags=["admin"])

class UserOut(User):
    class Config:
        from_attributes = True

@router.get("/users")
def list_users(session: Session = Depends(get_session), current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    users = session.exec(select(User)).all()
    admins = [u for u in users if u.role and u.role.name == "admin"]
    teachers = [u for u in users if u.role and u.role.name == "teacher"]
    students = [u for u in users if u.role and u.role.name == "student"]
    def dump(items: List[User]):
        return [{"id": u.id, "username": u.username, "status": u.status} for u in items]
    return {"admins": dump(admins), "teachers": dump(teachers), "students": dump(students)}

class StatusReq(BaseModel):
    status: str

@router.patch("/users/{uid}/status")
def update_status(uid: int, req: StatusReq, session: Session = Depends(get_session), current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    user = session.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.status = req.status
    session.add(user)
    session.commit()
    return {"id": user.id, "status": user.status}

@router.delete("/users/{uid}")
def disable_user(uid: int, session: Session = Depends(get_session), current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    user = session.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.status = "disabled"
    session.add(user)
    session.commit()
    return {"id": user.id, "status": user.status}

@router.get("/coursewares")
def list_coursewares(session: Session = Depends(get_session), current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    items = session.exec(select(Courseware)).all()
    return [
        {
            "id": c.id,
            "topic": c.topic,
            "teacher_id": c.teacher_id,
            "is_public": c.is_public,
            "created_at": c.created_at,
        } for c in items
    ]

@router.patch("/coursewares/{cid}/share")
def share_courseware(cid: int, session: Session = Depends(get_session), current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    cw = session.get(Courseware, cid)
    if not cw:
        raise HTTPException(status_code=404, detail="课件不存在")
    cw.is_public = True
    session.add(cw)
    session.commit()
    return {"id": cw.id, "is_public": cw.is_public}

@router.get("/stats")
def big_screen_stats(session: Session = Depends(get_session), current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限管理员访问")
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    teacher_daily = session.exec(select(Exercise).where(Exercise.created_at >= day_ago)).count()
    teacher_weekly = session.exec(select(Exercise).where(Exercise.created_at >= week_ago)).count()
    student_daily = session.exec(select(Submission).where(Submission.submitted_at >= day_ago)).count() + session.exec(select(Practice).where(Practice.created_at >= day_ago)).count()
    student_weekly = session.exec(select(Submission).where(Submission.submitted_at >= week_ago)).count() + session.exec(select(Practice).where(Practice.created_at >= week_ago)).count()
    avg_score = session.exec(select(Submission.score)).all()
    avg_score_val = sum(avg_score)/len(avg_score) if avg_score else 0
    return {
        "teacher_usage": {"daily": teacher_daily, "weekly": teacher_weekly},
        "student_usage": {"daily": student_daily, "weekly": student_weekly},
        "avg_score": avg_score_val
    }
