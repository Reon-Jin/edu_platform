# backend/services/lesson_service.py

import os
import re
import math
import subprocess
from collections import Counter, defaultdict
from functools import lru_cache
from typing import List, Tuple, Set

import backend.utils.deepseek_client as _ds
from backend.config import settings


def load_knowledge_texts() -> List[str]:
    """从本地知识库目录读取支持的文件类型并按段落拆分，去除重复。"""
    kb_dir = settings.KNOWLEDGE_BASE_DIR
    texts: List[str] = []
    if not os.path.isdir(kb_dir):
        return texts

    seen: Set[str] = set()
    for root, _, files in os.walk(kb_dir):
        for fn in files:
            path = os.path.join(root, fn)
            low = fn.lower()
            try:
                if low.endswith(".txt"):
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                elif low.endswith((".doc", ".docx")):
                    content = _extract_word_text(path)
                elif low.endswith(".pdf"):
                    content = _extract_pdf_text(path)
                else:
                    continue
            except Exception:
                continue

            for para in _segment_text(content):
                norm = re.sub(r"\s+", "", para)
                if norm and norm not in seen:
                    seen.add(norm)
                    texts.append(para)
    return texts


def _extract_word_text(file_path: str) -> str:
    """提取 Word 文档文本 (.doc 或 .docx)。"""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".docx":
        from docx import Document  # type: ignore

        doc = Document(file_path)
        paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paras)
    if ext == ".doc":
        try:
            raw = subprocess.check_output(
                ["antiword", "-m", "UTF-8.txt", file_path],
                stderr=subprocess.DEVNULL,
            )
            text = raw.decode("utf-8", errors="ignore")
        except Exception:
            try:
                import win32com.client  # type: ignore
                import pythoncom  # type: ignore

                word = win32com.client.DispatchEx("Word.Application")
                doc = word.Documents.Open(os.path.abspath(file_path), ReadOnly=True)
                text = doc.Content.Text
                doc.Close(False)
                word.Quit()
            except Exception as e:  # pragma: no cover - platform specific
                raise RuntimeError(f"无法提取 .doc 文档，请安装 antiword 或 pywin32: {e}")
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        return "\n\n".join(lines)
    raise ValueError(f"Unsupported Word file: {file_path}")


def _extract_pdf_text(file_path: str) -> str:
    """提取 PDF 文本。"""
    from PyPDF2 import PdfReader  # type: ignore

    reader = PdfReader(file_path)
    chunks: List[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        text = text.strip()
        if text:
            chunks.append(text)
    return "\n\n".join(chunks)


def _segment_text(content: str) -> List[str]:
    """根据空行和列表项拆分文本段落。"""
    content = content.replace("\r\n", "\n")
    lines = content.split("\n")
    segments: List[str] = []
    buf: List[str] = []
    bullet_re = re.compile(r"^[-*•]|^\d+[\.、]")
    for ln in lines:
        stripped = ln.strip()
        if not stripped:
            if buf:
                segments.append(" ".join(buf))
                buf = []
            continue
        if bullet_re.match(stripped):
            if buf:
                segments.append(" ".join(buf))
                buf = []
            segments.append(stripped)
        else:
            buf.append(stripped)
    if buf:
        segments.append(" ".join(buf))
    return segments


def _extract_keywords(topic: str) -> List[str]:
    """
    提取连续的中文或英文/数字/点号关键词，用于匹配知识库。
    """
    # 匹配中文字符块 或 包含字母数字和点号的词
    return re.findall(r"[\u4e00-\u9fa5]+|[A-Za-z0-9\.]+", topic)


def _tokenize(text: str) -> List[str]:
    """简单分词，将中英文、数字等统一小写处理"""
    return re.findall(r"[\u4e00-\u9fa5A-Za-z0-9\.]+", text.lower())


@lru_cache(maxsize=1)
def _build_index(texts: Tuple[str, ...]):
    tokenized = [_tokenize(t) for t in texts]
    doc_freq: defaultdict[str, int] = defaultdict(int)
    for toks in tokenized:
        for w in set(toks):
            doc_freq[w] += 1
    n_docs = len(texts)
    idf = {w: math.log(n_docs / (df + 1)) + 1 for w, df in doc_freq.items()}

    vectors = []
    for toks in tokenized:
        tf = Counter(toks)
        vec = {w: tf[w] * idf.get(w, 0.0) for w in tf}
        vectors.append(vec)
    return idf, vectors


def _vectorize(tokens: List[str], idf: dict) -> dict:
    tf = Counter(tokens)
    return {w: tf[w] * idf.get(w, 0.0) for w in tf}


def _cosine(v1: dict, v2: dict) -> float:
    dot = sum(v1.get(w, 0.0) * v2.get(w, 0.0) for w in set(v1) | set(v2))
    norm1 = math.sqrt(sum(v * v for v in v1.values()))
    norm2 = math.sqrt(sum(v * v for v in v2.values()))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


def _find_relevant_snippets(topic: str, texts: List[str], top_k: int = 3) -> List[str]:
    """使用 TF-IDF 余弦相似度从文本中检索相关段落"""
    if not texts:
        return []
    idf, vectors = _build_index(tuple(texts))
    q_vec = _vectorize(_tokenize(topic), idf)
    sims = [(_cosine(q_vec, vec), idx) for idx, vec in enumerate(vectors)]
    sims.sort(key=lambda x: x[0], reverse=True)
    return [texts[idx] for sim, idx in sims[:top_k] if sim > 0]


def _build_prompt(topic: str, knowledge_texts: List[str]) -> str:
    """
    构建发送给 Deepseek 的 prompt：
    - 列出所有相关知识库片段
    - 指示模型详实补全并输出纯 Markdown
    """
    snippets = _find_relevant_snippets(topic, knowledge_texts)
    if snippets:
        header = (
            f"以下是与“{topic}”相关的本地知识库内容，共 {len(snippets)} 条（仅供参考）：\n\n"
            + "\n".join(f"- {s}" for s in snippets)
            + "\n\n"
        )
    else:
        header = (
            f"本地知识库中未找到与“{topic}”相关的内容，"
            "请结合专业教学经验，补充完整所需知识点。\n\n"
        )

    return (
        "你是教师的备课助手，请结合以下知识库片段和自身教学经验，"
        "为主题设计一份真实可用的 45 分钟教案，"
        "结构清晰，便于前端渲染，并确保内容详实有效。\n\n"
        f"{header}"
        "备课要求：\n"
        "1. **知识讲解**：详细、准确，涵盖本节主题核心概念；\n"
        "2. **实训练习与指导**：给出练习题并说明讲解要点；\n"
        "3. **时间分布**：对导入/讲解/练习/讨论/总结等环节给出预计用时。\n\n"
        f"主题：{topic}\n"
        "请以纯 Markdown 输出，不要使用 ``` 包裹整篇；"
        "如有表格，请顶格书写且表格前后留空行。"
    )

async def generate_lesson(topic: str) -> str:
    """
    调用 Deepseek API，根据主题生成教案 Markdown 文本。
    """
    texts = load_knowledge_texts()
    if not texts:
        raise RuntimeError("本地知识库为空或无法读取")

    prompt = _build_prompt(topic, texts)
    result = _ds.call_deepseek_api(prompt=prompt)
    markdown_content = result["choices"][0]["message"]["content"]
    return markdown_content
