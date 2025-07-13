import random
import string
from typing import List, Optional

from sqlmodel import Session, select

from backend.config import engine
from backend.models import Classroom, ClassStudent, ClassHomework, TeacherSubject, Homework


def generate_unique_code(session: Session) -> str:
    while True:
        code = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        exists = session.exec(select(Classroom).where(Classroom.code == code)).first()
        if not exists:
            return code


def create_class(teacher_id: int, name: str, capacity: int, code: Optional[str] = None) -> Classroom:
    with Session(engine, expire_on_commit=False) as sess:
        if code:
            dup = sess.exec(select(Classroom).where(Classroom.code == code)).first()
            if dup:
                raise ValueError('code_exists')
        else:
            code = generate_unique_code(sess)
        classroom = Classroom(teacher_id=teacher_id, name=name, capacity=capacity, code=code)
        sess.add(classroom)
        sess.commit()
        sess.refresh(classroom)
        return classroom


def list_classes(teacher_id: int) -> List[Classroom]:
    with Session(engine) as sess:
        stmt = select(Classroom).where(Classroom.teacher_id == teacher_id)
        return sess.exec(stmt).all()


def list_class_students(class_id: int) -> List[ClassStudent]:
    with Session(engine) as sess:
        stmt = select(ClassStudent).where(ClassStudent.class_id == class_id)
        return sess.exec(stmt).all()


def join_class(student_id: int, code: str) -> Classroom | None:
    with Session(engine, expire_on_commit=False) as sess:
        cls = sess.exec(select(Classroom).where(Classroom.code == code)).first()
        if not cls:
            return None
        dup = sess.exec(select(ClassStudent).where(ClassStudent.class_id == cls.id, ClassStudent.student_id == student_id)).first()
        if dup:
            return cls
        sess.add(ClassStudent(class_id=cls.id, student_id=student_id))
        sess.commit()
        return cls


def list_student_classes(student_id: int) -> List[Classroom]:
    with Session(engine) as sess:
        stmt = select(Classroom).join(ClassStudent, Classroom.id == ClassStudent.class_id).where(ClassStudent.student_id == student_id)
        return sess.exec(stmt).all()


def assign_homework_to_classes(exercise_id: int, class_ids: List[int]) -> Homework:
    from backend.services.exercise_service import assign_homework
    hw = assign_homework(exercise_id, class_ids)
    return hw


def list_homeworks_for_class(student_id: int, class_id: int) -> List[Homework]:
    from backend.models import Homework
    with Session(engine) as sess:
        stmt = (
            select(Homework)
            .join(ClassHomework, Homework.id == ClassHomework.homework_id)
            .where(ClassHomework.class_id == class_id)
            .order_by(Homework.assigned_at)
        )
        return sess.exec(stmt).all()
