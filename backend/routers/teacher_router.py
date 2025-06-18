from datetime import datetime
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.auth import get_current_user
from backend.config import engine
from backend.models import User, Practice
from backend.services.analysis_service import analyze_student_practice
from backend.schemas.student_schema import PracticeOut

router = APIRouter(prefix="/teacher/students", tags=["student-data"])

class StudentMeta(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class PracticeMeta(BaseModel):
    id: int
    topic: str
    status: str
    score: int
    created_at: datetime
    class Config:
        from_attributes = True

@router.get("", response_model=List[StudentMeta])
def list_students(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    with Session(engine) as sess:
        stmt = select(User).where(User.role.has(name="student"))
        users = sess.exec(stmt).all()
        return [StudentMeta.model_validate(u, from_attributes=True) for u in users]

@router.get("/{sid}/analysis")
def student_analysis(sid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    return analyze_student_practice(sid)

@router.get("/{sid}/practices", response_model=List[PracticeMeta])
def student_practices(sid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    with Session(engine) as sess:
        stmt = select(Practice).where(Practice.student_id == sid, Practice.status == "completed")
        prs = sess.exec(stmt).all()
        return [PracticeMeta.model_validate(p, from_attributes=True) for p in prs]

@router.get("/{sid}/practice/{pid}", response_model=PracticeOut)
def practice_detail(sid: int, pid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    with Session(engine) as sess:
        pr = sess.get(Practice, pid)
        if not pr or pr.student_id != sid:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="练习不存在")
        return PracticeOut.model_validate(pr, from_attributes=True)
