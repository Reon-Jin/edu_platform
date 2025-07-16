"""prepare_knowledge.py
改进的知识库构建脚本：将 Word/PDF 文档转为纯文本并切分，随后建立
SQLite FTS5 + 向量索引，供教师备课检索。
"""

import os
import re
import json
import sqlite3
from pathlib import Path
from typing import List

# 自动下载 NLTK 分词模型，避免 LookupError: punkt_tab not found
import nltk
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)

from docx import Document
from pdfminer.high_level import extract_text as pdf_extract
from backend.utils import rag_pipeline

INPUT_DIR = "../word_files"
OUTPUT_DIR = "../knowledge"
INDEX_DB = "../knowledge/index.db"
MAX_LENGTH = 2000


def extract_text(file_path: str) -> str:
    """根据扩展名提取文本内容"""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".docx":
        doc = Document(file_path)
        paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paras)
    if ext == ".pdf":
        return pdf_extract(file_path)
    if ext in {".txt", ".md"}:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    raise ValueError(f"Unsupported file type: {file_path}")


def merge_paragraphs(text: str) -> str:
    text = re.sub(r"(\n\s*){2,}", "\n\n", text)
    return text.strip()


def chunk_by_length(text: str, max_len: int = MAX_LENGTH) -> List[str]:
    # 基于固定字符数切片，若需按 token 切片，可在 rag_pipeline 中调整
    chunks = []
    for i in range(0, len(text), max_len):
        chunk = text[i : i + max_len].strip()
        if chunk:
            chunks.append(chunk)
    return chunks


def process_directory() -> None:
    for root, _, files in os.walk(INPUT_DIR):
        rel = os.path.relpath(root, INPUT_DIR)
        out_dir = os.path.join(OUTPUT_DIR, rel)
        os.makedirs(out_dir, exist_ok=True)
        for fn in files:
            if not fn.lower().endswith((".docx", ".pdf", ".txt", ".md")):
                continue
            path_in = os.path.join(root, fn)
            print(f"Processing {path_in}...")
            try:
                raw = extract_text(path_in)
            except Exception as e:
                print(f"Failed to extract {path_in}: {e}")
                continue
            merged = merge_paragraphs(raw)
            parts = chunk_by_length(merged)
            content = "\n\n".join(parts)
            base = os.path.splitext(fn)[0]
            out_file = os.path.join(out_dir, f"{base}.txt")
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(content)
    print("All documents processed.")


def build_index() -> None:
    # 在索引前确保 NLTK 资源可用
    kb_path = Path(OUTPUT_DIR)
    rag_pipeline.build_index(str(kb_path), INDEX_DB)
    print(f"Index built at {INDEX_DB}")


if __name__ == "__main__":
    process_directory()
    build_index()
