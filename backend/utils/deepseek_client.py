# backend/utils/deepseek_client.py

import requests
from backend.config import settings

def call_deepseek_api(prompt: str, model: str = "deepseek-chat", temperature: float = 0.7, max_tokens: int = 4096):
    """
    调用 Deepseek 聊天接口，返回完整 JSON 响应。
    """
    url = settings.DEEPSEEK_ENDPOINT  # 例如 "https://api.deepseek.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    # 打印调试信息（可根据需要注释）
    print(">>> Deepseek 请求 URL：", url)
    print(">>> Deepseek 请求头：", headers)
    print(">>> Deepseek 请求体：", data)

    resp = requests.post(url, headers=headers, json=data, timeout=100, allow_redirects=False)
    print(">>> Deepseek 返回状态码：", resp.status_code)
    print(">>> Deepseek 返回体：", resp.text)

    if resp.status_code == 200:
        return resp.json()
    else:
        raise Exception(f"API 请求失败，状态码: {resp.status_code}, 错误信息: {resp.text}")
