from pathlib import Path
from typing import List

import numpy as np
from sqlmodel import Session, select
from sqlalchemy import delete

from backend.config import engine, settings
from backend.models import Document, DocumentVector
from backend.utils.rag_pipeline import get_model, chunk_document


def save_document(owner_id: int, filename: str, data: bytes, is_public: bool = False) -> Document:
    with Session(engine, expire_on_commit=False) as sess:
        doc = Document(owner_id=owner_id, filename=filename, filepath="", is_public=is_public)
        sess.add(doc)
        sess.commit()
        sess.refresh(doc)

        doc_dir = Path(settings.DOC_STORAGE_DIR) / str(owner_id) / str(doc.id)
        doc_dir.mkdir(parents=True, exist_ok=True)
        path = doc_dir / filename
        with open(path, "wb") as f:
            f.write(data)
        doc.filepath = str(path)
        sess.add(doc)
        sess.commit()

        model = get_model()
        chunks = chunk_document(str(path))
        for idx, ck in enumerate(chunks):
            vec = model.encode(ck)
            sess.add(DocumentVector(doc_id=doc.id, chunk_index=idx, vector_blob=vec.astype(np.float32).tobytes()))
        sess.commit()
        return doc


def list_my_documents(owner_id: int) -> List[Document]:
    with Session(engine) as sess:
        stmt = select(Document).where(Document.owner_id == owner_id)
        return sess.exec(stmt).all()


def list_public_documents() -> List[Document]:
    with Session(engine) as sess:
        stmt = select(Document).where(Document.is_public == True)
        return sess.exec(stmt).all()


def toggle_active(doc_id: int, owner_id: int) -> Document | None:
    with Session(engine, expire_on_commit=False) as sess:
        doc = sess.get(Document, doc_id)
        if not doc or doc.owner_id != owner_id:
            return None
        doc.is_active = not doc.is_active
        sess.add(doc)
        sess.commit()
        sess.refresh(doc)
        return doc


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
            for p in path.parent.glob('*'):
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
        doc.filepath = str(path)
        sess.add(doc)
        sess.commit()

        model = get_model()
        chunks = chunk_document(str(path))
        for idx, ck in enumerate(chunks):
            vec = model.encode(ck)
            sess.add(
                DocumentVector(
                    doc_id=doc.id,
                    chunk_index=idx,
                    vector_blob=vec.astype(np.float32).tobytes(),
                )
            )
        sess.commit()
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
