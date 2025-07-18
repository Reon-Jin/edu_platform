# backend/services/document_service.py

from pathlib import Path
from typing import List
from datetime import datetime
import logging

import numpy as np
from pydantic import BaseModel
from sqlmodel import Session, select
from sqlalchemy import delete as sa_delete

from backend.config import engine, settings
from backend.models import Document, DocumentVector, DocumentActivation
from backend.utils.rag_pipeline import get_model, chunk_document


class DocumentWithActivation(BaseModel):
    id: int
    filename: str
    filepath: str
    uploaded_at: datetime
    is_active: bool
    is_public: bool

    class Config:
        from_attributes = True


def _index_document(doc_id: int, path: Path) -> None:
    """Chunk document and store vectors."""
    with Session(engine, expire_on_commit=False) as sess:
        model = get_model()
        chunks = chunk_document(str(path))
        for idx, ck in enumerate(chunks):
            vec = model.encode(ck)
            sess.add(
                DocumentVector(
                    doc_id=doc_id,
                    chunk_index=idx,
                    vector_blob=vec.astype(np.float32).tobytes(),
                )
            )
        sess.commit()


def save_document(
    owner_id: int, filename: str, data: bytes, is_public: bool = False
) -> Document:
    with Session(engine, expire_on_commit=False) as sess:
        # Create document metadata
        doc = Document(
            owner_id=owner_id,
            filename=filename,
            filepath="",
            is_public=is_public,
        )
        sess.add(doc)
        sess.commit()
        sess.refresh(doc)

        # Write file to storage (treat .doc and .docx the same)
        doc_dir = Path(settings.DOC_STORAGE_DIR) / str(owner_id) / str(doc.id)
        doc_dir.mkdir(parents=True, exist_ok=True)
        path = doc_dir / filename
        path.write_bytes(data)

        # Update filepath and initial activation flag
        doc.filepath = str(path)
        sess.add(doc)
        sess.add(
            DocumentActivation(teacher_id=owner_id, doc_id=doc.id, is_active=False)
        )
        sess.commit()

    # Index the document asynchronously
    try:
        _index_document(doc.id, path)
    except Exception as e:
        logging.error("Indexing document %s failed: %s", doc.id, e)

    return doc


def list_my_documents(owner_id: int) -> List[Document]:
    with Session(engine) as sess:
        stmt = (
            select(Document, DocumentActivation.is_active)
            .outerjoin(
                DocumentActivation,
                (DocumentActivation.doc_id == Document.id)
                & (DocumentActivation.teacher_id == owner_id),
            )
            .where(Document.owner_id == owner_id)
        )
        rows = sess.exec(stmt).all()
        docs: List[Document] = []
        for doc, active in rows:
            doc.is_active = bool(active) if active is not None else False
            docs.append(doc)
        return docs


def list_public_documents(teacher_id: int) -> List[DocumentWithActivation]:
    with Session(engine) as sess:
        stmt = (
            select(Document, DocumentActivation.is_active)
            .outerjoin(
                DocumentActivation,
                (DocumentActivation.doc_id == Document.id)
                & (DocumentActivation.teacher_id == teacher_id),
            )
            .where(Document.is_public == True)
        )
        rows = sess.exec(stmt).all()
        result: List[DocumentWithActivation] = []
        for doc, active in rows:
            result.append(
                DocumentWithActivation(
                    id=doc.id,
                    filename=doc.filename,
                    filepath=doc.filepath,
                    uploaded_at=doc.uploaded_at,
                    is_active=bool(active) if active is not None else False,
                    is_public=doc.is_public,
                )
            )
        return result


def set_activation(doc_id: int, teacher_id: int, is_active: bool) -> bool:
    with Session(engine, expire_on_commit=False) as sess:
        doc = sess.get(Document, doc_id)
        if not doc:
            return False
        if not doc.is_public and doc.owner_id != teacher_id:
            return False
        da = sess.get(DocumentActivation, (teacher_id, doc_id))
        if not da:
            da = DocumentActivation(
                teacher_id=teacher_id, doc_id=doc_id, is_active=is_active
            )
            sess.add(da)
        else:
            da.is_active = is_active
            sess.add(da)
        sess.commit()
        return True


def delete_document(doc_id: int, owner_id: int) -> bool:
    with Session(engine, expire_on_commit=False) as sess:
        doc = sess.get(Document, doc_id)
        if not doc or doc.owner_id != owner_id or doc.is_public:
            return False

        # 1. Remove all chunk vectors
        sess.execute(sa_delete(DocumentVector).where(DocumentVector.doc_id == doc_id))

        # 2. Remove all activation records
        sess.execute(
            sa_delete(DocumentActivation).where(DocumentActivation.doc_id == doc_id)
        )

        # 3. Clean up filesystem
        path = Path(doc.filepath)
        if path.exists():
            try:
                path.unlink()
            except Exception:
                pass
        if path.parent.exists():
            for p in path.parent.glob("*"):
                p.unlink(missing_ok=True)
            path.parent.rmdir()

        # 4. Delete metadata
        sess.delete(doc)
        sess.commit()
        return True


def save_public_document(owner_id: int, filename: str, data: bytes) -> Document:
    with Session(engine, expire_on_commit=False) as sess:
        # Create public document metadata
        doc = Document(
            owner_id=owner_id,
            filename=filename,
            filepath="",
            is_public=True,
            is_active=True,
        )
        sess.add(doc)
        sess.commit()
        sess.refresh(doc)

        # Write file to storage
        doc_dir = Path(settings.DOC_STORAGE_DIR) / "public" / str(doc.id)
        doc_dir.mkdir(parents=True, exist_ok=True)
        path = doc_dir / filename
        path.write_bytes(data)

        # Update filepath
        doc.filepath = str(path)
        sess.add(doc)
        sess.commit()

    # Index the public document
    try:
        _index_document(doc.id, path)
    except Exception as e:
        logging.error("Indexing public document %s failed: %s", doc.id, e)

    return doc


def delete_public_document(doc_id: int) -> bool:
    with Session(engine, expire_on_commit=False) as sess:
        doc = sess.get(Document, doc_id)
        if not doc or not doc.is_public:
            return False

        # Remove vectors
        sess.execute(sa_delete(DocumentVector).where(DocumentVector.doc_id == doc_id))

        # Clean up filesystem
        path = Path(doc.filepath)
        if path.exists():
            try:
                path.unlink()
            except Exception:
                pass
        if path.parent.exists():
            for p in path.parent.glob("*"):
                p.unlink(missing_ok=True)
            path.parent.rmdir()

        # Delete metadata
        sess.delete(doc)
        sess.commit()
        return True
