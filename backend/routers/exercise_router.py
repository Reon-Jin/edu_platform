# backend/routers/exercise_router.py

import io
from typing import List
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.schemas.exercise_schema import (
    GenerateExerciseRequest, ExercisePreviewOut, ExerciseOut
)
from backend.schemas.homework_schema import HomeworkOut
from backend.services.exercise_service import (
    preview_exercise, save_exercise, save_and_assign_exercise,
    get_exercise, list_exercises,
    download_questions_pdf, download_answers_pdf,
    assign_homework, stats_for_exercise
)
from backend.auth import get_current_user
from backend.models import User

router = APIRouter(prefix="/teacher/exercise", tags=["exercise"])


class SaveExerciseRequest(BaseModel):
    topic: str
    questions: List[dict]
    answers: dict


@router.post(
    "/generate",
    response_model=ExercisePreviewOut,
    summary="生成并预览练习（不保存）"
)
def api_generate(
    req: GenerateExerciseRequest,
    user: User = Depends(get_current_user)
):
    if not user.role or user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    return preview_exercise(
        topic=req.topic,
        num_mcq=req.num_mcq,
        num_fill_blank=req.num_fill_blank,
        num_short_answer=req.num_short_answer,
        num_programming=req.num_programming,
    )


@router.post(
    "/save",
    response_model=ExerciseOut,
    summary="保存练习（入库，不布置）"
)
def api_save(
    req: SaveExerciseRequest,
    user: User = Depends(get_current_user)
):
    if not user.role or user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    ex = save_exercise(
        teacher_id=user.id,
        topic=req.topic,
        questions=req.questions,
        answers=req.answers
    )
    return ex


@router.post(
    "/save_and_assign",
    response_model=HomeworkOut,
    summary="保存练习并布置作业"
)
def api_save_and_assign(
    req: SaveExerciseRequest,
    user: User = Depends(get_current_user)
):
    if not user.role or user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    hw = save_and_assign_exercise(
        teacher_id=user.id,
        topic=req.topic,
        questions=req.questions,
        answers=req.answers
    )
    return hw


@router.get(
    "/list",
    response_model=List[ExerciseOut],
    summary="获取我的练习列表"
)
def api_list(
    user: User = Depends(get_current_user)
):
    if not user.role or user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    return list_exercises(teacher_id=user.id)


@router.get(
    "/preview/{ex_id}",
    response_model=ExerciseOut,
    summary="预览已保存练习"
)
def api_preview(
    ex_id: int,
    user: User = Depends(get_current_user)
):
    ex = get_exercise(ex_id)
    if not ex or ex.teacher_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="练习不存在或无权限")
    return ex


@router.get(
    "/{ex_id}/download/questions",
    response_class=StreamingResponse,
    summary="下载练习题目 PDF"
)
def api_download_questions(
    ex_id: int,
    user: User = Depends(get_current_user)
):
    ex = get_exercise(ex_id)
    if not ex or ex.teacher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权下载")

    # 同步生成 PDF bytes
    pdf_bytes = download_questions_pdf(ex)

    # 构造支持中文的下载文件名
    raw_name = f"questions_{ex_id}.pdf"
    fallback = "questions.pdf"
    quoted = quote(raw_name, safe="")
    headers = {
        "Content-Disposition": f"attachment; filename={fallback}; filename*=UTF-8''{quoted}"
    }

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers=headers
    )


@router.get(
    "/{ex_id}/download/answers",
    response_class=StreamingResponse,
    summary="下载练习答案 PDF"
)
def api_download_answers(
    ex_id: int,
    user: User = Depends(get_current_user)
):
    ex = get_exercise(ex_id)
    if not ex or ex.teacher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权下载")

    pdf_bytes = download_answers_pdf(ex)

    raw_name = f"answers_{ex_id}.pdf"
    fallback = "answers.pdf"
    quoted = quote(raw_name, safe="")
    headers = {
        "Content-Disposition": f"attachment; filename={fallback}; filename*=UTF-8''{quoted}"
    }

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers=headers
    )


@router.post(
    "/{ex_id}/assign",
    response_model=HomeworkOut,
    summary="布置已有练习"
)
def api_assign(
    ex_id: int,
    user: User = Depends(get_current_user)
):
    ex = get_exercise(ex_id)
    if not ex or ex.teacher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权布置")
    return assign_homework(ex_id)


@router.get(
    "/{ex_id}/stats",
    summary="练习统计"
)
def api_stats(
    ex_id: int,
    user: User = Depends(get_current_user)
):
    ex = get_exercise(ex_id)
    if not ex or ex.teacher_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看")
    return stats_for_exercise(ex_id)
