# backend/tests/test_auth.py

import pytest
from sqlmodel import Session, create_engine, SQLModel, select
from fastapi.testclient import TestClient
import os

# 一定要在 import auth 之前先修改 settings
from backend.config import settings
from backend.models import Role  # 确保引入 Role

# 测试用临时 SQLite 数据库地址
TEST_SQLITE = "sqlite:///./test_app.db"

# 全局 engine 变量，用于 teardown 时关闭连接
engine = None

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    global engine

    # 1. 如果存在旧的 test_app.db，先删掉
    if os.path.exists("test_app.db"):
        os.remove("test_app.db")

    # 2. 将 settings.MYSQL_URI 指向 SQLite（否则 auth 模块仍会用 MySQL）
    settings.MYSQL_URI = TEST_SQLITE

    # 3. 创建 SQLite engine 并创建所有表
    engine = create_engine(
        TEST_SQLITE,
        connect_args={"check_same_thread": False},
        echo=False
    )
    SQLModel.metadata.create_all(engine)

    # 4. 预填充 role 数据到 SQLite
    with Session(engine) as sess:
        for role_name in ("student", "teacher", "admin"):
            r = Role(name=role_name)
            sess.add(r)
        sess.commit()

    # 5. 覆盖后端 auth 模块里已有的 engine
    import backend.auth as auth_module
    auth_module.engine = engine

    yield  # 暂停到所有测试执行完毕

    # 6. 测试结束后关闭连接并删除数据库文件
    engine.dispose()
    if os.path.exists("test_app.db"):
        os.remove("test_app.db")


@pytest.fixture
def client():
    from backend.main import app
    return TestClient(app)


def test_register_and_login_success(client):
    # -------- 注册 Alice --------
    resp = client.post(
        "/auth/register",
        json={"username": "alice", "password": "pwd123", "role": "student"}
    )
    assert resp.status_code == 201, f"Expected 201 but got {resp.status_code}"
    data = resp.json()
    assert data["username"] == "alice"
    assert data["role"] == "student"
    assert "id" in data

    # -------- 登录 Alice --------
    resp2 = client.post(
        "/auth/login",
        json={"username": "alice", "password": "pwd123"}
    )
    assert resp2.status_code == 200, f"Expected 200 but got {resp2.status_code}"
    data2 = resp2.json()
    assert data2["username"] == "alice"
    assert data2["role"] == "student"


def test_register_duplicate_username(client):
    # 先注册 Bob
    client.post("/auth/register", json={"username": "bob", "password": "x", "role": "teacher"})
    # 再次用相同用户名注册，应返回 400
    resp = client.post("/auth/register", json={"username": "bob", "password": "y", "role": "teacher"})
    assert resp.status_code == 400
    assert "Username exists" in resp.text


def test_register_invalid_role(client):
    # 用不存在的角色注册，应返回 400
    resp = client.post("/auth/register", json={"username": "charlie", "password": "x", "role": "unknown"})
    assert resp.status_code == 400
    assert "Invalid role" in resp.text


def test_login_bad_credentials(client):
    # 不存在的用户登录，应返回 401
    resp = client.post("/auth/login", json={"username": "nonexistent", "password": "whatever"})
    assert resp.status_code == 401

    # 注册 Dave 后，用错误密码登录，应返回 401
    client.post("/auth/register", json={"username": "dave", "password": "correct", "role": "admin"})
    resp2 = client.post("/auth/login", json={"username": "dave", "password": "wrong"})
    assert resp2.status_code == 401
