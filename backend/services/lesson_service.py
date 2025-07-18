# backend/services/lesson_service.py

from typing import List, Tuple

import backend.utils.deepseek_client as _ds
from backend.utils import rag_pipeline
from backend.db import get_session


def _retrieve_snippets(topic: str, user_id: int) -> List[Tuple[str, str]]:
    """从数据库检索与主题相关的文本块"""
    with next(get_session()) as sess:
        return rag_pipeline.retrieve_from_db(topic, user_id, sess, top_k=5)


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

async def generate_lesson(topic: str, user_id: int) -> str:
    """
    调用 Deepseek API，根据主题生成教案 Markdown 文本。
    """
    snippets = _retrieve_snippets(topic, user_id)
    prompt = _build_prompt(topic, snippets)
    result = _ds.call_deepseek_api(prompt=prompt)
    markdown_content = result["choices"][0]["message"]["content"]
    return markdown_content


async def optimize_lesson(markdown: str, instruction: str) -> str:
    """根据教师的额外要求优化现有教案 Markdown。"""
    prompt = (
        "你是一名教学助手，请根据老师的以下要求对给出的教案内容进行修改优化，"
        "并返回新的教案 Markdown：\n\n"
        f"老师要求：{instruction}\n\n"
        f"原教案内容：\n{markdown}\n\n"
        "请直接输出优化后的 Markdown，不要使用 ``` 包裹。"
    )
    result = _ds.call_deepseek_api(prompt=prompt)
    return result["choices"][0]["message"]["content"]
