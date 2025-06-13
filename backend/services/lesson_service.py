# backend/services/lesson_service.py

import os
import re
from typing import List

import backend.utils.deepseek_client as _ds
from backend.config import settings


def load_knowledge_texts() -> List[str]:
    """
    从本地知识库目录读取所有 .txt 文件，返回文本列表。
    """
    kb_dir = settings.KNOWLEDGE_BASE_DIR
    texts: List[str] = []
    if not os.path.isdir(kb_dir):
        return texts
    for fn in os.listdir(kb_dir):
        if fn.lower().endswith(".txt"):
            path = os.path.join(kb_dir, fn)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        texts.append(content)
            except Exception:
                continue
    return texts


def _extract_keywords(topic: str) -> List[str]:
    """
    提取连续的中文或英文/数字/点号关键词，用于匹配知识库。
    """
    # 匹配中文字符块 或 包含字母数字和点号的词
    return re.findall(r"[\u4e00-\u9fa5]+|[A-Za-z0-9\.]+", topic)


def _find_relevant_snippets(topic: str, texts: List[str]) -> List[str]:
    """
    从 texts 中筛选出所有包含任意关键词的段落，保持段落完整。
    """
    keywords = _extract_keywords(topic)
    relevant: List[str] = []
    for text in texts:
        low = text.lower()
        # 若段落中包含任一关键词，则视为相关
        if any(k.lower() in low for k in keywords):
            snippet = text.strip()
            relevant.append(snippet)
    return relevant


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
