# backend/routers/homework_router.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from backend.auth import get_current_user
from backend.schemas.submission_schema import (
    SubmitRequest,
    SubmissionStatusOut,
    HomeworkStudentOut,
    HomeworkResultOut
)
from backend.schemas.exercise_schema import ExerciseOut, ExerciseQuestionsOut
from backend.services.exercise_service import normalize_exercise
from backend.services.submission_service import (
    list_student_homeworks,
    submit_homework,
    grade_submission,
    get_submission_by_hw_student,
    get_homework_exercise,
)

router = APIRouter(prefix="/student", tags=["homework"])

@router.get("/homeworks", response_model=List[HomeworkStudentOut])
def api_list(user=Depends(get_current_user)):
    return list_student_homeworks(user.id)


@router.get("/homeworks/{hw_id}/exercise", response_model=ExerciseQuestionsOut)
def api_hw_exercise(hw_id: int, user=Depends(get_current_user)):
    ex = get_homework_exercise(hw_id)
    if not ex:
        raise HTTPException(status_code=404, detail="作业不存在")
    return ExerciseQuestionsOut(id=ex.id, subject=ex.subject, prompt=ex.prompt)

@router.post(
    "/homeworks/{hw_id}/submit",
    response_model=SubmissionStatusOut
)
def api_submit(
    hw_id: int,
    req: SubmitRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user)
):
    sub = submit_homework(hw_id, user.id, req.answers)
    # 异步批改
    background_tasks.add_task(grade_submission, sub.id)
    return SubmissionStatusOut(submission_id=sub.id, status=sub.status)

@router.get(
    "/homeworks/{hw_id}/result",
    response_model=HomeworkResultOut
)
def api_result(hw_id: int, user=Depends(get_current_user)):
    sub = get_submission_by_hw_student(hw_id, user.id)
    if not sub:
        raise HTTPException(status_code=404, detail="未提交作业")
    if sub.status != "completed":
        raise HTTPException(status_code=400, detail="作业尚在批改中")
    # sub.homework 及 sub.homework.exercise 已可访问
    exercise = normalize_exercise(sub.homework.exercise)
    exercise_data = ExerciseOut.model_validate(exercise, from_attributes=True)
    return HomeworkResultOut(
        exercise=exercise_data,
        student_answers=sub.answers,
        feedback=sub.feedback,
        score=sub.score
    )
