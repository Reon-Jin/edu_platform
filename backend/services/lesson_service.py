# backend/services/lesson_service.py

import os
from typing import List, Tuple

import backend.utils.deepseek_client as _ds
from backend.config import settings
from backend.utils import rag_pipeline

INDEX_DB = os.path.join(settings.KNOWLEDGE_BASE_DIR, "index.db")


def _retrieve_snippets(topic: str) -> List[Tuple[str, str]]:
    """使用 RAG 索引检索与主题最相关的文本片段"""
    if not os.path.isfile(INDEX_DB):
        raise RuntimeError("知识库索引不存在，请先运行 prepare_knowledge.py")
    return rag_pipeline.retrieve(topic, INDEX_DB, top_k=20)


def _build_prompt(topic: str, knowledge_texts: List[Tuple[str, str]]) -> str:
    """
    构建发送给 Deepseek 的 prompt：
    - 列出所有相关知识库片段
    - 指示模型详实补全并输出纯 Markdown
    """
    snippets = knowledge_texts
    if snippets:
        header = (
            f"以下是与“{topic}”相关的本地知识库内容，共 {len(snippets)} 条（仅供参考）：\n\n"
            + "\n".join(f"- [{doc}] {text}" for doc, text in snippets)
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
    snippets = _retrieve_snippets(topic)
    prompt = _build_prompt(topic, snippets)
    result = _ds.call_deepseek_api(prompt=prompt)
    markdown_content = result["choices"][0]["message"]["content"]
    return markdown_content
