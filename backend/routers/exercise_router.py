import io
from typing import List
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.schemas.exercise_schema import GenerateExerciseRequest, ExercisePreviewOut, ExerciseOut
from backend.schemas.homework_schema import HomeworkOut
from backend.services.exercise_service import (
    preview_exercise,
    save_exercise,
    save_and_assign_exercise,
    get_exercise,
    get_homework,
    list_exercises,
    download_questions_pdf,
    download_answers_pdf,
    assign_homework,
    stats_for_exercise,
    render_exercise_pdf,
    normalize_exercise,
)
from backend.auth import get_current_user
from backend.models import User

router = APIRouter(prefix="/teacher/exercise", tags=["exercise"])


class SaveExerciseRequest(BaseModel):
    topic: str
    questions: List[dict]
    answers: dict


@router.post("/generate")
def api_generate(req: GenerateExerciseRequest, user: User = Depends(get_current_user)):
    if user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    data = preview_exercise(
        topic=req.topic,
        num_mcq=req.num_mcq,
        num_fill_blank=req.num_fill_blank,
        num_short_answer=req.num_short_answer,
        num_programming=req.num_programming,
    )
    if req.export_pdf:
        pdf = render_exercise_pdf(f"练习：{req.topic}", data.get("questions", []), answers=data.get("answers", {}))
        raw = f"exercise_{req.topic}.pdf"
        headers = {
            "Content-Disposition": f"attachment; filename=exercise.pdf; filename*=UTF-8''{quote(raw)}"
        }
        return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf", headers=headers)
    return ExercisePreviewOut.model_validate(data)


@router.post("/save", response_model=ExerciseOut)
def api_save(req: SaveExerciseRequest, user: User = Depends(get_current_user)):
    if user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    ex = save_exercise(user.id, req.topic, req.questions, req.answers)
    ex = normalize_exercise(ex)
    return ExerciseOut.model_validate(ex, from_attributes=True)


@router.post("/save_and_assign", response_model=HomeworkOut)
def api_save_and_assign(req: SaveExerciseRequest, user: User = Depends(get_current_user)):
    if user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    hw = save_and_assign_exercise(user.id, req.topic, req.questions, req.answers)
    hw.exercise = normalize_exercise(hw.exercise)
    return hw


@router.get("/list", response_model=List[ExerciseOut])
def api_list(user: User = Depends(get_current_user)):
    if user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    items = [normalize_exercise(ex) for ex in list_exercises(user.id)]
    return [ExerciseOut.model_validate(it, from_attributes=True) for it in items]


@router.get("/preview/{ex_id}", response_model=ExerciseOut)
def api_preview(ex_id: int, user: User = Depends(get_current_user)):
    ex = get_exercise(ex_id)
    if not ex or ex.teacher_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="未找到练习")
    ex = normalize_exercise(ex)
    return ExerciseOut.model_validate(ex, from_attributes=True)


@router.get("/{ex_id}/download/questions", response_class=StreamingResponse)
def api_download_questions(ex_id: int, user: User = Depends(get_current_user)):
    ex = get_exercise(ex_id)
    if not ex:
        hw = get_homework(ex_id)
        if not hw or hw.exercise.teacher_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权下载")
        ex = hw.exercise
    elif ex.teacher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权下载")

    ex = normalize_exercise(ex)
    data = download_questions_pdf(ex)
    raw = f"questions_{ex.id}.pdf"
    headers = {
        "Content-Disposition": f"attachment; filename=questions.pdf; filename*=UTF-8''{quote(raw)}"
    }
    return StreamingResponse(io.BytesIO(data), media_type="application/pdf", headers=headers)


@router.get("/{ex_id}/download/answers", response_class=StreamingResponse)
def api_download_answers(ex_id: int, user: User = Depends(get_current_user)):
    ex = get_exercise(ex_id)
    if not ex:
        hw = get_homework(ex_id)
        if not hw or hw.exercise.teacher_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权下载")
        ex = hw.exercise
    elif ex.teacher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权下载")

    ex = normalize_exercise(ex)
    data = download_answers_pdf(ex)
    raw = f"answers_{ex.id}.pdf"
    headers = {
        "Content-Disposition": f"attachment; filename=answers.pdf; filename*=UTF-8''{quote(raw)}"
    }
    return StreamingResponse(io.BytesIO(data), media_type="application/pdf", headers=headers)


@router.post("/{ex_id}/assign", response_model=HomeworkOut)
def api_assign(ex_id: int, user: User = Depends(get_current_user)):
    ex = get_exercise(ex_id)
    if not ex or ex.teacher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权布置")
    try:
        return assign_homework(ex_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="未找到练习")


@router.get("/{ex_id}/stats")
def api_stats(ex_id: int, user: User = Depends(get_current_user)):
    ex = get_exercise(ex_id)
    if not ex or ex.teacher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看")
    return stats_for_exercise(ex_id)
