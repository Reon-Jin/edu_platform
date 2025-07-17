from datetime import datetime
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.auth import get_current_user
from backend.config import engine
from backend.models import User, Class
from backend.services.analysis_service import get_latest_analysis
from backend.services.submission_service import (
    list_completed_submissions,
    get_submission_by_hw_student,
)
from backend.utils.scoring import compute_total_points
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
def student_analysis(
    sid: int,
    class_id: int | None = None,
    current: User = Depends(get_current_user),
):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")

    if class_id is not None:
        with Session(engine) as sess:
            c = sess.get(Class, class_id)
            if not c or c.teacher_id != current.id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="class not found")

    content = get_latest_analysis(sid, teacher_id=current.id)
    return {"analysis": content or ""}

@router.get("/{sid}/homeworks", response_model=List[SubmissionMeta])
def student_homeworks(
    sid: int,
    class_id: int | None = None,
    current: User = Depends(get_current_user),
):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    if class_id is not None:
        with Session(engine) as sess:
            c = sess.get(Class, class_id)
            if not c or c.teacher_id != current.id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="class not found")
    subs = list_completed_submissions(sid, class_id=class_id)
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
        total_score=compute_total_points(sub.homework.exercise),
    )
