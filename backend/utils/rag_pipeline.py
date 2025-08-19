# backend/utils/rag_pipeline.py

import os
import re
import logging
import platform
from pathlib import Path
from typing import List, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer
from nltk.tokenize import word_tokenize
from sqlalchemy import select, text
import textract

from backend.models import Document, DocumentActivation

# Try to import pywin32 COM if available
try:
    import win32com.client
    from win32com.client import gencache, constants
except ImportError:
    win32com = None

# Initialize the embedding model once
_model = None


def get_model() -> SentenceTransformer:
    """Return a singleton SentenceTransformer model."""
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def extract_text(path: str) -> str:
    """
    Extract plain text from a document.
     - .txt/.md: read directly
     - .doc: on Windows, convert to .docx via COM then use textract
     - others (.docx, .pdf, etc.): use textract directly
    """
    suffix = Path(path).suffix.lower()

    if suffix in {".txt", ".md"}:
        try:
            return Path(path).read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            logging.error("Failed to read %s: %s", path, e)
            return ""

    if suffix == ".doc":
        if platform.system() != "Windows" or win32com is None:
            logging.error("Cannot extract .doc on non-Windows or missing pywin32: %s", path)
            return ""
        tmp_path = str(path) + "x"  # abc.doc -> abc.docx
        word = None
        doc = None
        try:
            word = gencache.EnsureDispatch("Word.Application")
            word.Visible = False
            doc = word.Documents.Open(os.path.abspath(path), ReadOnly=True)
            doc.SaveAs(os.path.abspath(tmp_path), FileFormat=constants.wdFormatXMLDocument)
            doc.Close(False)
            text_bytes = textract.process(tmp_path)
            return text_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            logging.error("Failed to extract from .doc %s: %s", path, e)
            return ""
        finally:
            if doc:
                try:
                    doc.Close(False)
                except Exception:
                    pass
            if word:
                try:
                    word.Quit()
                except Exception:
                    pass
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

    # fallback for .docx, .pdf, etc.
    try:
        raw = textract.process(path)
        return raw.decode("utf-8", errors="ignore")
    except Exception as e:
        logging.error("textract failed on %s: %s", path, e)
        return ""


def _chunk_text(text: str, size: int = 400, overlap: int = 50) -> List[str]:
    """Tokenize and split text into overlapping chunks."""
    tokens = word_tokenize(text)
    chunks = []
    step = size - overlap
    for i in range(0, len(tokens), step):
        part = tokens[i : i + size]
        if part:
            chunks.append(" ".join(part))
    return chunks


def chunk_document(path: str) -> List[str]:
    """Extract text then chunk it into fixed-size segments."""
    text = extract_text(path)
    return _chunk_text(text) if text else []


def retrieve_paragraphs(
    query: str,
    user_id: int,
    session,
    top_k: int = 5,
    include_inactive: bool = False,
) -> List[Tuple[int, str]]:
    """
    Retrieve the top_k most relevant paragraphs for `query` from
    the teacher's documents.  By default only documents that the
    teacher has activated are considered.  If ``include_inactive`` is
    ``True`` then all documents associated with the teacher will be
    used regardless of activation state.

    Returns a list of ``(doc_id, paragraph_text)`` tuples.
    """
    model = get_model()
    q_vec = model.encode(query)

    # fetch documents for this teacher
    stmt = (
        select(Document)
        .join(DocumentActivation, DocumentActivation.doc_id == Document.id)
        .where(DocumentActivation.teacher_id == user_id)
    )
    if not include_inactive:
        stmt = stmt.where(DocumentActivation.is_active == 1)
    docs = session.exec(stmt).scalars().all()

    candidates: List[Tuple[int, str, float]] = []
    for doc in docs:
        full_text = extract_text(doc.filepath)
        if not full_text:
            continue

        # split into paragraphs on blank lines
        paras = [p.strip() for p in full_text.split("\n\n") if p.strip()]
        if not paras:
            continue

        # embed all paragraphs
        para_vecs = model.encode(paras)
        sims = para_vecs @ q_vec  # inner product similarity
        best_idx = int(np.argmax(sims))
        candidates.append((doc.id, paras[best_idx], float(sims[best_idx])))

    # sort by similarity score and return top_k
    candidates.sort(key=lambda x: x[2], reverse=True)
    top = candidates[:top_k]
    return [(doc_id, para) for doc_id, para, _ in top]


def retrieve_from_db(
    query: str,
    user_id: int,
    session,
    top_k: int = 5
) -> List[Tuple[int, str]]:
    """
    Fallback retrieval by chunk, returns list of (doc_id, chunk_text).
    """
    q_vec = get_model().encode(query)
    sql = (
        "SELECT v.doc_id, v.chunk_index, v.vector_blob, d.filepath "
        "FROM document_vector v "
        "JOIN document d ON v.doc_id=d.id "
        "JOIN document_activation a ON a.doc_id=d.id "
        "WHERE a.teacher_id=:uid AND a.is_active=1"
    )
    stmt = text(sql).bindparams(uid=user_id)
    rows = session.exec(stmt).all()
    if not rows:
        return []

    vectors = [np.frombuffer(r.vector_blob, dtype=np.float32) for r in rows]
    sims = np.array(vectors) @ q_vec
    idxs = sims.argsort()[-top_k:][::-1]

    results: List[Tuple[int, str]] = []
    for i in idxs:
        r = rows[i]
        chunks = chunk_document(r.filepath)
        text_chunk = chunks[r.chunk_index] if r.chunk_index < len(chunks) else ""
        results.append((r.doc_id, text_chunk))
    return results
