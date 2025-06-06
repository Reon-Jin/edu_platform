# backend/tests/test_lesson.py

import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel

# 1. 确保 backend/static 目录存在，避免 StaticFiles 挂载时报错
os.makedirs("backend/static", exist_ok=True)

# 2. 在导入 Settings 之前，设置必需的环境变量
os.environ["DEEPSEEK_API_KEY"] = "fake_key_for_dev"
os.environ["DEEPSEEK_ENDPOINT"] = "https://api.deepseek.mock/v1/chat/completions"
os.environ["KNOWLEDGE_BASE_DIR"] = "backend/knowledge/"

# 3. 打桩：在导入 lesson.py 之前，先修改 backend.utils.deepseek_client.call_deepseek_api
import importlib

ds_module = importlib.import_module("backend.utils.deepseek_client")


def fake_call(prompt: str, *args, **kwargs):
    return {
        "choices": [
            {
                "message": {
                    "content": (
                        "# 测试 Markdown 内容\n\n"
                        "## 知识讲解\n示例讲解内容\n\n"
                        "## 实训练习与指导\n示例训练内容\n\n"
                        "## 时间分布\n示例时间分布"
                    )
                }
            }
        ]
    }


ds_module.call_deepseek_api = fake_call

# 4. 打桩：在导入 lesson.py 之前，修改 load_knowledge_texts
lesson_module = importlib.import_module("backend.lesson")
lesson_module.load_knowledge_texts = lambda: ["dummy knowledge"]

# 5. 现在导入 app，确保打桩生效
from backend.main import app
from backend.config import settings
from backend.models import Role

TEST_SQLITE = "sqlite:///./test_lesson.db"


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    在整个测试会话开始前：
      1. 如果 test_lesson.db 存在，先删除它，保证干净环境。
      2. 将 settings.MYSQL_URI 指向 TEST_SQLITE。
      3. 基于 SQLModel 定义创建所有表。
      4. 插入三种 Role 记录（student、teacher、admin）。
    会话结束后，再尝试删除 test_lesson.db（忽略 PermissionError）。
    """
    db_file = "test_lesson.db"
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except PermissionError:
            pass

    settings.MYSQL_URI = TEST_SQLITE
    engine = create_engine(TEST_SQLITE, connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as sess:
        for role_name in ("student", "teacher", "admin"):
            sess.add(Role(name=role_name))
        sess.commit()

    yield

    try:
        if os.path.exists(db_file):
            os.remove(db_file)
    except PermissionError:
        pass


@pytest.fixture
def client():
    return TestClient(app)


def test_prepare_markdown_success(client):
    """
    测试：export_pdf=False 时正常返回 Markdown，
    因为 load_knowledge_texts 和 call_deepseek_api 都已被打桩。
    """
    resp = client.post("/lesson/prepare", json={"topic": "测试主题", "export_pdf": False})
    assert resp.status_code == 200

    data = resp.json()
    assert "markdown" in data
    markdown = data["markdown"]
    assert "# 测试 Markdown 内容" in markdown
    assert "## 知识讲解" in markdown
    assert "## 实训练习与指导" in markdown
    assert "## 时间分布" in markdown


def test_prepare_empty_topic(client):
    """
    测试：当 topic 为空时返回 400
    """
    resp = client.post("/lesson/prepare", json={"topic": "", "export_pdf": False})
    assert resp.status_code == 400
    assert "topic 不能为空" in resp.json()["detail"]


def test_prepare_no_knowledge(client, monkeypatch):
    """
    测试：模拟本地知识库为空 → load_knowledge_texts 返回空列表 → 返回 500
    """
    # 用 monkeypatch 临时把 load_knowledge_texts 设为空列表
    import backend.lesson as lm
    monkeypatch.setattr(lm, "load_knowledge_texts", lambda: [])

    resp = client.post("/lesson/prepare", json={"topic": "测试", "export_pdf": False})
    assert resp.status_code == 500
    assert "本地知识库为空" in resp.json()["detail"]




def test_export_pdf_wkhtml_failure(client, monkeypatch):
    """
    测试：模拟 wkhtmltopdf 未安装，pdfkit.from_string 抛出 OSError
    """
    # 保证知识库非空
    # 保证知识库非空（临时覆盖，测试结束后还原）
    import backend.lesson as lm
    monkeypatch.setattr(lm, "load_knowledge_texts", lambda: ["dummy"])
    # 让 pdfkit.from_string 抛出 OSError，模拟 wkhtmltopdf 未安装
    import pdfkit
    monkeypatch.setattr(pdfkit, "from_string",
                        lambda *args, **kwargs: (_ for _ in ()).throw(OSError("wkhtmltopdf not found")))
    resp = client.post("/lesson/prepare", json={"topic": "测试PDF", "export_pdf": True})
    assert resp.status_code == 500
    assert "PDF 生成失败" in resp.json()["detail"]
