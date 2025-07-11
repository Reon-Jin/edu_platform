# backend/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import select, Session
from sqlalchemy import text
from datetime import datetime, timedelta
import jwt
from pydantic import BaseModel

from backend.config import settings, engine
from backend.models import User, Role

router = APIRouter(tags=["auth"])

# OAuth2 密码模式，指向 /auth/token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# JWT 配置
SECRET_KEY = getattr(settings, "SECRET_KEY", "CHANGE_ME_PLEASE")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def get_session():
    with Session(engine) as sess:
        yield sess

# — 注册时接收的数据模型 —
class RegisterData(BaseModel):
    username: str
    password: str
    role: str

# — /auth/token 返回的模型 —
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterData, sess: Session = Depends(get_session)):
    # 校验角色
    db_role = sess.exec(select(Role).where(Role.name == data.role)).first()
    if not db_role:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    # 校验用户名是否存在
    exists = sess.exec(select(User).where(User.username == data.username)).first()
    if exists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Username exists")
    # 创建用户
    user = User(username=data.username, password=data.password, role_id=db_role.id)
    sess.add(user)
    sess.commit()
    sess.refresh(user)
    return {"id": user.id, "username": user.username, "role": db_role.name}

@router.post("/token", response_model=TokenResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    sess: Session = Depends(get_session),
):
    # 兼容旧表结构，通过原生查询以避免缺失 status 字段导致报错
    row = sess.exec(
        text("SELECT * FROM user WHERE username=:u"),
        {"u": form_data.username},
    ).first()
    if not row:
        user_data = None
    else:
        data = row._mapping if hasattr(row, "_mapping") else row
        user_data = {
            "id": data.get("id"),
            "username": data.get("username"),
            "password": data.get("password"),
            "role_id": data.get("role_id"),
            "status": data.get("status", "normal"),
        }
    if not user_data or user_data["password"] != form_data.password:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user_data["status"] != "normal":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="账号状态异常")
    user = User(**user_data)
    # 生成 JWT
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(user.id), "exp": expire}
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    # 获取角色名
    db_role = sess.get(Role, user.role_id)
    role_name = db_role.name if db_role else ""
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role_name
    }

def get_current_user(
    token: str = Depends(oauth2_scheme),
    sess: Session = Depends(get_session),
) -> User:
    credentials_exception = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        detail="认证失败",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    try:
        row = sess.exec(
            text("SELECT * FROM user WHERE id=:i"),
            {"i": int(user_id)},
        ).first()
    except Exception:
        row = None
    if not row:
        raise credentials_exception
    data = row._mapping if hasattr(row, "_mapping") else row
    user = User(
        id=data.get("id"),
        username=data.get("username"),
        password=data.get("password"),
        role_id=data.get("role_id"),
        status=data.get("status", "normal"),
    )
    return user

@router.get("/me")
def read_current_user(user: User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username, "role": user.role.name}

__all__ = ["router", "get_current_user"]
