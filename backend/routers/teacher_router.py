from datetime import datetime
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.auth import get_current_user
from backend.config import engine
from backend.models import User
from backend.services.analysis_service import analyze_student_homeworks
from backend.services.submission_service import (
    list_completed_submissions,
    get_submission_by_hw_student,
)
from backend.schemas.exercise_schema import ExerciseOut
from backend.schemas.submission_schema import HomeworkResultOut

router = APIRouter(prefix="/teacher/students", tags=["student-data"])

class StudentMeta(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class SubmissionMeta(BaseModel):
    homework_id: int
    subject: str
    score: int
    submitted_at: datetime

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
    return analyze_student_homeworks(sid)

@router.get("/{sid}/homeworks", response_model=List[SubmissionMeta])
def student_homeworks(sid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    subs = list_completed_submissions(sid)
    return [
        SubmissionMeta(
            homework_id=s.homework_id,
            subject=s.homework.exercise.subject,
            score=s.score,
            submitted_at=s.submitted_at,
        )
        for s in subs
    ]

@router.get("/{sid}/homework/{hw_id}", response_model=HomeworkResultOut)
def homework_detail(sid: int, hw_id: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    sub = get_submission_by_hw_student(hw_id, sid)
    if not sub or sub.status != "completed":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="作业不存在")
    ex_data = ExerciseOut.model_validate(sub.homework.exercise, from_attributes=True)
    return HomeworkResultOut(
        exercise=ex_data,
        student_answers=sub.answers,
        feedback=sub.feedback,
        score=sub.score,
    )
