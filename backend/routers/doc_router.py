from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlmodel import Session

from backend.auth import get_current_user
from backend.db import get_session
from backend.models import User, Document
from backend.services.document_service import (
    save_document,
    list_my_documents,
    list_public_documents,
    toggle_active,
    delete_document,
)

router = APIRouter(prefix="/docs", tags=["docs"])


@router.post("/")
async def upload_doc(
    file: UploadFile = File(...),
    is_public: bool = False,
    session: Session = Depends(get_session),
    current: User = Depends(get_current_user),
):
    if current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师上传")
    data = await file.read()
    doc = save_document(current.id, file.filename, data, is_public=is_public)
    return {"id": doc.id, "filename": doc.filename, "is_active": doc.is_active, "is_public": doc.is_public, "uploaded_at": doc.uploaded_at}


@router.get("/")
def list_docs(scope: str = "my", current: User = Depends(get_current_user)):
    if current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    if scope == "public":
        docs = list_public_documents()
    else:
        docs = list_my_documents(current.id)
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "is_active": d.is_active,
            "is_public": d.is_public,
            "uploaded_at": d.uploaded_at,
        }
        for d in docs
    ]


@router.patch("/{doc_id}/activate")
def activate_doc(doc_id: int, current: User = Depends(get_current_user)):
    if current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    doc = toggle_active(doc_id, current.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文档不存在")
    return {"is_active": doc.is_active}


@router.delete("/{doc_id}")
def delete_doc(doc_id: int, current: User = Depends(get_current_user)):
    if current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    ok = delete_document(doc_id, current.id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="无法删除")
    return {"status": "ok"}
