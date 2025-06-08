from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import io

from backend.schemas.exercise_schema import GenerateExerciseRequest, ExerciseOut
from backend.schemas.homework_schema import HomeworkOut
from backend.services.exercise_service import (
    generate_exercise, get_exercise,
    download_questions_pdf, download_answers_pdf,
    assign_homework, stats_for_exercise
)
from backend.auth import get_current_user

router = APIRouter(prefix="/teacher", tags=["exercise"])

@router.post("/generate", response_model=ExerciseOut)
def api_generate(req: GenerateExerciseRequest, user=Depends(get_current_user)):
    return generate_exercise(
        teacher_id=user.id,
        topic=req.topic,
        num_mcq=req.num_mcq,
        num_fill_blank=req.num_fill_blank,
        num_short_answer=req.num_short_answer,
        num_programming=req.num_programming,
    )

@router.get(
    "/exercise/{ex_id}/download/questions",
    response_class=StreamingResponse,
    responses={200:{"content":{"application/pdf":{}}}}
)
def api_download_questions(ex_id: int, user=Depends(get_current_user)):
    ex = get_exercise(ex_id)
    if ex.teacher_id != user.id:
        raise HTTPException(403, "无权下载")
    pdf = download_questions_pdf(ex)
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf",
                            headers={"Content-Disposition":f'attachment; filename="questions_{ex_id}.pdf"'})

@router.get(
    "/exercise/{ex_id}/download/answers",
    response_class=StreamingResponse,
    responses={200:{"content":{"application/pdf":{}}}}
)
def api_download_answers(ex_id: int, user=Depends(get_current_user)):
    ex = get_exercise(ex_id)
    if ex.teacher_id != user.id:
        raise HTTPException(403, "无权下载")
    pdf = download_answers_pdf(ex)
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf",
                            headers={"Content-Disposition":f'attachment; filename="answers_{ex_id}.pdf"'})

@router.post("/exercise/{ex_id}/assign", response_model=HomeworkOut)
def api_assign(ex_id: int, user=Depends(get_current_user)):
    ex = get_exercise(ex_id)
    if ex.teacher_id != user.id:
        raise HTTPException(403, "无权布置")
    return assign_homework(ex_id)

@router.get("/exercise/{ex_id}/stats")
def api_stats(ex_id: int, user=Depends(get_current_user)):
    ex = get_exercise(ex_id)
    if ex.teacher_id != user.id:
        raise HTTPException(403, "无权查看")
    return stats_for_exercise(ex_id)
