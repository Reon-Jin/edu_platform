# backend/routers/lesson_router.py

import io
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.services.lesson_service import generate_lesson
from backend.auth import get_current_user
from backend.models import User

router = APIRouter(prefix="/teacher/lesson", tags=["prepare"])

class LessonRequest(BaseModel):
    topic: str
    export_pdf: bool = False

@router.post(
    "/prepare",
    summary="教师：生成教案（Markdown 或 PDF）",
    responses={
        200: {
            "content": {
                "application/json": {"schema": {"type": "object", "properties": {"markdown": {"type": "string"}}}},
                "application/pdf": {"schema": {"type": "string", "format": "binary"}}
            }
        }
    },
)
async def prepare_lesson(
    req: LessonRequest,
    current_user: User = Depends(get_current_user),
):
    # 内联角色校验
    if not current_user.role or current_user.role.name != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅限教师角色访问"
        )

    topic = req.topic.strip()
    if not topic:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="topic 不能为空")

    try:
        result = await generate_lesson(topic, export_pdf=req.export_pdf)
    except RuntimeError as err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(err))

    if not req.export_pdf:
        return {"markdown": result}

    return StreamingResponse(
        io.BytesIO(result),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="lesson_{topic}.pdf"'}
    )
