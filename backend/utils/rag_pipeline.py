import os
import re
import json
import sqlite3
from typing import List, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer
from nltk.tokenize import word_tokenize
from sqlalchemy import text
import textract

# 初始化嵌入模型
_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


# ====== 构建索引 ======


def _read_txt_files(kb_dir: str) -> List[Tuple[str, str]]:
    """读取目录下的所有 txt 文件，返回 (文件名, 内容)"""
    items = []
    for fn in os.listdir(kb_dir):
        if fn.lower().endswith(".txt"):
            path = os.path.join(kb_dir, fn)
            with open(path, "r", encoding="utf-8") as f:
                items.append((fn, f.read()))
    return items


def _chunk_text(text: str, size: int = 400, overlap: int = 50) -> List[str]:
    tokens = word_tokenize(text)
    chunks = []
    step = size - overlap
    for i in range(0, len(tokens), step):
        part = tokens[i : i + size]
        if not part:
            continue
        chunks.append(" ".join(part))
    return chunks


def extract_text(path: str) -> str:
    """Extract plain text from supported document formats."""
    ext = os.path.splitext(path)[1].lower()
    if ext in {".txt", ".md"}:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    try:
        return textract.process(path).decode("utf-8", errors="ignore")
    except Exception as e:
        raise ValueError(
            f"Unsupported file type or extraction failed: {path}"
        ) from e


def chunk_document(path: str) -> List[str]:
    text = extract_text(path)
    return _chunk_text(text)


def build_index(kb_dir: str, db_path: str):
    """根据知识库目录构建 FTS5 + 向量索引"""
    items = _read_txt_files(kb_dir)
    if not items:
        raise RuntimeError("未找到任何知识文本")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS chunks USING fts5(doc, section, content)"
    )
    cur.execute(
        "CREATE TABLE IF NOT EXISTS vectors(id INTEGER PRIMARY KEY, vector BLOB)"
    )

    model = get_model()
    idx = 0
    for doc, text in items:
        sections = re.split(r"\n(?=\d+\.)", text)
        for sec in sections:
            clean = sec.strip()
            if not clean:
                continue
            chunks = _chunk_text(clean)
            for ck in chunks:
                cur.execute(
                    "INSERT INTO chunks(doc, section, content) VALUES(?,?,?)",
                    (doc, sec[:20], ck),
                )
                vector = model.encode(ck)
                cur.execute(
                    "INSERT INTO vectors(id, vector) VALUES(?,?)",
                    (idx, vector.tobytes()),
                )
                idx += 1
    conn.commit()
    conn.close()


# ====== 检索 ======


def _fetch_vectors(conn, ids: List[int]) -> np.ndarray:
    cur = conn.cursor()
    q = "SELECT id, vector FROM vectors WHERE id IN (%s)" % ",".join("?" * len(ids))
    rows = cur.execute(q, ids).fetchall()
    rows.sort(key=lambda x: ids.index(x[0]))
    vecs = [np.frombuffer(r[1], dtype=np.float32) for r in rows]
    return np.vstack(vecs)


def retrieve(query: str, db_path: str, top_k: int = 5) -> List[Tuple[str, str]]:
    """使用 FTS5 与向量检索，若命中小标题则返回整段内容"""
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    tokens = word_tokenize(query)
    fts_query = " OR ".join(tokens) if tokens else query

    # ---- 尝试匹配小标题 ----
    if tokens:
        sec_query = " OR ".join(f"section:{t}" for t in tokens)
        cur.execute(
            "SELECT DISTINCT doc, section FROM chunks WHERE chunks MATCH ?",
            (sec_query,),
        )
        sec_rows = cur.fetchall()
        if sec_rows:
            sections = []
            for doc, sec in sec_rows:
                cur.execute(
                    "SELECT content FROM chunks WHERE doc=? AND section=?",
                    (doc, sec),
                )
                texts = [r[0] for r in cur.fetchall()]
                sections.append((doc, " ".join(texts)))

            model = get_model()
            q_vec = model.encode(query)
            vecs = model.encode([txt for _, txt in sections])
            sims = vecs @ q_vec
            idxs = sims.argsort()[-top_k:][::-1]
            conn.close()
            return [sections[i] for i in idxs]

    # ---- 常规检索 ----
    cur.execute(
        "SELECT rowid, doc, content FROM chunks WHERE chunks MATCH ?",
        (fts_query,),
    )
    rows = cur.fetchall()
    # 若结果过少，降级为遍历所有向量
    if len(rows) < top_k:
        cur.execute("SELECT rowid, doc, content FROM chunks")
        rows = cur.fetchall()

    ids = [r[0] - 1 for r in rows]  # rowid 从1开始，与向量表索引对应
    vecs = _fetch_vectors(conn, ids)
    model = get_model()
    q_vec = model.encode(query)
    sims = vecs @ q_vec
    top_indices = sims.argsort()[-top_k:][::-1]
    results = [(rows[i][1], rows[i][2]) for i in top_indices]
    conn.close()
    return results


def retrieve_from_db(
    query: str, user_id: int, session, top_k: int = 5
) -> List[Tuple[str, str]]:
    """Retrieve relevant chunks for a teacher from MySQL document tables."""
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
    results = []
    for i in idxs:
        r = rows[i]
        chunks = chunk_document(r.filepath)
        text_chunk = chunks[r.chunk_index] if r.chunk_index < len(chunks) else ""
        results.append((os.path.basename(r.filepath), text_chunk))
    return results
