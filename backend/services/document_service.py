from pathlib import Path
from typing import List
from datetime import datetime
import logging
from pydantic import BaseModel

import numpy as np
from sqlmodel import Session, select
from sqlalchemy import delete

from backend.config import engine, settings
from backend.models import Document, DocumentVector, DocumentActivation
from backend.utils.rag_pipeline import get_model, chunk_document
from backend.utils.word_utils import convert_doc_to_docx


class DocumentWithActivation(BaseModel):
    id: int
    filename: str
    filepath: str
    uploaded_at: datetime
    is_active: bool

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
        doc = Document(
            owner_id=owner_id, filename=filename, filepath="", is_public=is_public
        )
        sess.add(doc)
        sess.commit()
        sess.refresh(doc)

        doc_dir = Path(settings.DOC_STORAGE_DIR) / str(owner_id) / str(doc.id)
        doc_dir.mkdir(parents=True, exist_ok=True)
        path = doc_dir / filename
        with open(path, "wb") as f:
            f.write(data)

        if path.suffix.lower() == ".doc":
            try:
                path = convert_doc_to_docx(path)
            except Exception as e:
                sess.delete(doc)
                sess.commit()
                raise RuntimeError(f"DOC conversion failed: {e}")
            doc.filename = path.name

        doc.filepath = str(path)
        sess.add(doc)
        sess.add(
            DocumentActivation(teacher_id=owner_id, doc_id=doc.id, is_active=False)
        )
        sess.commit()

    try:
        _index_document(doc.id, path)
    except Exception as e:  # pragma: no cover - logging only
        logging.error("Indexing document %s failed: %s", doc.id, e)
    return doc


def list_my_documents(owner_id: int) -> List[Document]:
    """Return documents owned by teacher that they have activated."""
    with Session(engine) as sess:
        stmt = (
            select(Document, DocumentActivation.is_active)
            .join(DocumentActivation, DocumentActivation.doc_id == Document.id)
            .where(
                Document.owner_id == owner_id,
                DocumentActivation.teacher_id == owner_id,
                DocumentActivation.is_active == True,
            )
        )
        rows = sess.exec(stmt).all()
        docs = []
        for doc, active in rows:
            doc.is_active = active
            docs.append(doc)
        return docs


def list_public_documents(teacher_id: int) -> List[DocumentWithActivation]:
    """Return all public documents with the teacher's activation flag."""
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
        docs = []
        for doc, active in rows:
            docs.append(
                DocumentWithActivation(
                    id=doc.id,
                    filename=doc.filename,
                    filepath=doc.filepath,
                    uploaded_at=doc.uploaded_at,
                    is_active=bool(active) if active is not None else False,
                )
            )
        return docs


def set_activation(doc_id: int, teacher_id: int, is_active: bool) -> bool:
    """Set activation state for a teacher on a document."""
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
        sess.execute(delete(DocumentVector).where(DocumentVector.doc_id == doc_id))
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
        sess.delete(doc)
        sess.commit()
        return True


def save_public_document(owner_id: int, filename: str, data: bytes) -> Document:
    """Save a document as public and active under storage/public."""
    with Session(engine, expire_on_commit=False) as sess:
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

        doc_dir = Path(settings.DOC_STORAGE_DIR) / "public" / str(doc.id)
        doc_dir.mkdir(parents=True, exist_ok=True)
        path = doc_dir / filename
        with open(path, "wb") as f:
            f.write(data)

        if path.suffix.lower() == ".doc":
            try:
                path = convert_doc_to_docx(path)
            except Exception as e:
                sess.delete(doc)
                sess.commit()
                raise RuntimeError(f"DOC conversion failed: {e}")
            doc.filename = path.name

        doc.filepath = str(path)
        sess.add(doc)
        sess.commit()

    try:
        _index_document(doc.id, path)
    except Exception as e:  # pragma: no cover - logging only
        logging.error("Indexing document %s failed: %s", doc.id, e)
    return doc


def delete_public_document(doc_id: int) -> bool:
    """Delete a public document and its vectors."""
    with Session(engine, expire_on_commit=False) as sess:
        doc = sess.get(Document, doc_id)
        if not doc or not doc.is_public:
            return False
        sess.execute(delete(DocumentVector).where(DocumentVector.doc_id == doc_id))
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
        sess.delete(doc)
        sess.commit()
        return True
