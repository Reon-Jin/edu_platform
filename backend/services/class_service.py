from typing import List
from sqlmodel import Session, select

from backend.config import engine
from backend.models import Class, ClassStudent, User, Homework, Submission
from sqlmodel import select


def create_class(teacher_id: int, name: str, subject: str) -> Class:
    """Create a new class for teacher."""
    with Session(engine, expire_on_commit=False) as sess:
        c = Class(name=name, subject=subject, teacher_id=teacher_id)
        sess.add(c)
        sess.commit()
        sess.refresh(c)
        return c


def list_classes_for_teacher(teacher_id: int) -> List[Class]:
    """Return teacher's classes."""
    with Session(engine) as sess:
        stmt = select(Class).where(Class.teacher_id == teacher_id)
        return sess.exec(stmt).all()


def get_class_with_students(class_id: int) -> Class | None:
    with Session(engine) as sess:
        return sess.get(Class, class_id)


def list_classes_for_student(student_id: int) -> List[Class]:
    with Session(engine) as sess:
        stmt = (
            select(Class)
            .join(ClassStudent, Class.id == ClassStudent.class_id)
            .where(ClassStudent.student_id == student_id)
        )
        return sess.exec(stmt).all()


def add_student_to_class(student_id: int, class_id: int) -> None:
    with Session(engine) as sess:
        exists = sess.get(Class, class_id)
        if not exists:
            raise ValueError("class not found")
        link = sess.get(ClassStudent, (class_id, student_id))
        if link:
            return
        sess.add(ClassStudent(class_id=class_id, student_id=student_id))
        sess.commit()


def remove_student_from_class(class_id: int, student_id: int) -> None:
    with Session(engine) as sess:
        assoc = sess.get(ClassStudent, (class_id, student_id))
        if assoc:
            sess.delete(assoc)
            sess.commit()


def delete_class(class_id: int) -> bool:
    """Delete a class and related data."""
    with Session(engine) as sess:
        c = sess.get(Class, class_id)
        if not c:
            return False

        # delete homework and submissions
        for hw in sess.exec(select(Homework).where(Homework.class_id == class_id)):
            for sub in sess.exec(select(Submission).where(Submission.homework_id == hw.id)):
                sess.delete(sub)
            sess.delete(hw)

        # delete student associations
        for assoc in sess.exec(select(ClassStudent).where(ClassStudent.class_id == class_id)):
            sess.delete(assoc)

        sess.delete(c)
        sess.commit()
        return True
