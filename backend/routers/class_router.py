from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from backend.auth import get_current_user
from backend.models import User
from backend.schemas import ClassCreateRequest, ClassMeta, ClassStudentMeta
from backend.schemas.submission_schema import HomeworkStudentOut
from backend.services.class_service import (
    create_class, list_classes, list_class_students,
    join_class, list_student_classes
)
from backend.services.submission_service import list_student_homeworks

router_teacher = APIRouter(prefix="/teacher/classes", tags=["classes"])
router_student = APIRouter(prefix="/student/classes", tags=["classes"])


@router_teacher.post("/create", response_model=ClassMeta)
def api_create_class(data: ClassCreateRequest, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师")
    try:
        cls = create_class(current.id, data.name, data.capacity, data.code)
    except ValueError:
        raise HTTPException(status_code=400, detail="code_exists")
    return ClassMeta.model_validate(cls, from_attributes=True)


@router_teacher.get("", response_model=List[ClassMeta])
def api_list_classes(current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师")
    classes = list_classes(current.id)
    return [ClassMeta.model_validate(c, from_attributes=True) for c in classes]


@router_teacher.get("/{cid}/students", response_model=List[ClassStudentMeta])
def api_class_students(cid: int, current: User = Depends(get_current_user)):
    if not current.role or current.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅限教师")
    students = list_class_students(cid)
    return [ClassStudentMeta(id=s.student_id, username=s.student.username) for s in students]


@router_student.get("", response_model=List[ClassMeta])
def api_student_classes(current: User = Depends(get_current_user)):
    classes = list_student_classes(current.id)
    return [ClassMeta.model_validate(c, from_attributes=True) for c in classes]


@router_student.post("/join", response_model=ClassMeta)
def api_join_class(code: str, current: User = Depends(get_current_user)):
    cls = join_class(current.id, code)
    if not cls:
        raise HTTPException(404, "class_not_found")
    return ClassMeta.model_validate(cls, from_attributes=True)


@router_student.get("/{cid}/homeworks", response_model=List[HomeworkStudentOut])
def api_homeworks_for_class(cid: int, current: User = Depends(get_current_user)):
    return list_student_homeworks(current.id, class_id=cid)
