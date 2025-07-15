from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import select, Session
from sqlalchemy import func

from backend.auth import get_current_user
from backend.config import engine
from backend.models import User, Class, ClassStudent
from backend.services.class_service import (
    create_class,
    list_classes_for_teacher,
    list_classes_for_student,
    add_student_to_class,
    remove_student_from_class,
    delete_class,
)

router = APIRouter(prefix="/classes", tags=["class"])


class ClassCreateRequest(BaseModel):
    name: str
    subject: str


class ClassOut(BaseModel):
    id: int
    name: str
    subject: str
    student_count: int

    class Config:
        from_attributes = True


class JoinRequest(BaseModel):
    class_id: int


class StudentMeta(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class ClassDetailOut(ClassOut):
    students: List[StudentMeta]


@router.post("/teacher", response_model=ClassOut)
def api_create_class(req: ClassCreateRequest, user: User = Depends(get_current_user)):
    if user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    c = create_class(user.id, req.name, req.subject)
    return ClassOut(id=c.id, name=c.name, subject=c.subject, student_count=0)


@router.get("/teacher", response_model=List[ClassOut])
def api_list_teacher_classes(user: User = Depends(get_current_user)):
    if user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    classes = list_classes_for_teacher(user.id)
    out = []
    with Session(engine) as sess:
        for c in classes:
            count = sess.exec(
                select(func.count()).select_from(ClassStudent).where(ClassStudent.class_id == c.id)
            ).one()
            out.append(
                ClassOut(
                    id=c.id,
                    name=c.name,
                    subject=c.subject,
                    student_count=count,
                )
            )
    return out


@router.get("/teacher/{cid}", response_model=ClassDetailOut)
def api_teacher_class_detail(cid: int, user: User = Depends(get_current_user)):
    if user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    with Session(engine) as sess:
        c = sess.get(Class, cid)
        if not c or c.teacher_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")
        studs = sess.exec(
            select(User).join(ClassStudent, ClassStudent.student_id == User.id).where(ClassStudent.class_id == cid)
        ).all()
        count = len(studs)
        students = [StudentMeta.model_validate(s, from_attributes=True) for s in studs]
    return ClassDetailOut(id=c.id, name=c.name, subject=c.subject, student_count=count, students=students)


@router.delete("/teacher/{cid}/student/{sid}")
def api_remove_student(cid: int, sid: int, user: User = Depends(get_current_user)):
    if user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    remove_student_from_class(cid, sid)
    return {"status": "ok"}


@router.delete("/teacher/{cid}")
def api_delete_class(cid: int, user: User = Depends(get_current_user)):
    if user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师访问")
    with Session(engine) as sess:
        c = sess.get(Class, cid)
        if not c or c.teacher_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")
    delete_class(cid)
    return {"status": "ok"}


@router.get("/student", response_model=List[ClassOut])
def api_list_student_classes(user: User = Depends(get_current_user)):
    if user.role.name != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限学生访问")
    classes = list_classes_for_student(user.id)
    out = []
    with Session(engine) as sess:
        for c in classes:
            count = sess.exec(
                select(func.count()).select_from(ClassStudent).where(ClassStudent.class_id == c.id)
            ).one()
            out.append(
                ClassOut(
                    id=c.id,
                    name=c.name,
                    subject=c.subject,
                    student_count=count,
                )
            )
    return out


@router.post("/student/join")
def api_join_class(req: JoinRequest, user: User = Depends(get_current_user)):
    if user.role.name != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限学生访问")
    try:
        add_student_to_class(user.id, req.class_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")
    return {"status": "ok"}


@router.get("/student/{cid}", response_model=ClassOut)
def api_student_class_detail(cid: int, user: User = Depends(get_current_user)):
    if user.role.name != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限学生访问")
    with Session(engine) as sess:
        c = sess.get(Class, cid)
        if not c:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")
        count = sess.exec(
            select(func.count()).select_from(ClassStudent).where(ClassStudent.class_id == cid)
        ).one()
    return ClassOut(id=c.id, name=c.name, subject=c.subject, student_count=count)


@router.delete("/student/{cid}")
def api_student_leave_class(cid: int, user: User = Depends(get_current_user)):
    if user.role.name != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限学生访问")
    remove_student_from_class(cid, user.id)
    return {"status": "ok"}

