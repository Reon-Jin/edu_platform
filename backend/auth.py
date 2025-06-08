# backend/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import select, Session
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
    # 验证用户名/密码
    user = sess.exec(select(User).where(User.username == form_data.username)).first()
    if not user or user.password != form_data.password:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # 生成 JWT
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(user.id), "exp": expire}
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

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

    user = sess.get(User, int(user_id))
    if not user:
        raise credentials_exception
    return user

__all__ = ["router", "get_current_user"]
