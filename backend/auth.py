# backend/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, Session, create_engine
from pydantic import BaseModel

from backend.config import settings            # 注意这里
from backend.models import User, Role          # 以及这里

engine = create_engine(settings.MYSQL_URI, echo=True)
def get_session():
    with Session(engine) as sess:
        yield sess

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterData(BaseModel):
    username: str
    password: str
    role: str

class LoginData(BaseModel):
    username: str
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterData, sess: Session = Depends(get_session)):
    db_role = sess.exec(select(Role).where(Role.name == data.role)).first()
    if not db_role:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    if sess.exec(select(User).where(User.username == data.username)).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Username exists")
    user = User(username=data.username, password=data.password, role_id=db_role.id)
    sess.add(user); sess.commit(); sess.refresh(user)
    return {"id": user.id, "username": user.username, "role": db_role.name}

@router.post("/login")
def login(data: LoginData, sess: Session = Depends(get_session)):
    user = sess.exec(select(User).where(User.username == data.username)).first()
    if not user or user.password != data.password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Bad credentials")
    db_role = sess.exec(select(Role).where(Role.id == user.role_id)).first()
    return {"username": user.username, "role": db_role.name}
