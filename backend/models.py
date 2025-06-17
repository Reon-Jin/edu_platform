# backend/models.py
from typing import Optional, Any, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON, LargeBinary

class Role(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, nullable=False, unique=True)
    users: List["User"] = Relationship(back_populates="role")

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(max_length=50, nullable=False, unique=True)
    password: str = Field(nullable=False)
    role_id: Optional[int] = Field(default=None, foreign_key="role.id")

    role: Optional[Role] = Relationship(back_populates="users")
    exercises: List["Exercise"]     = Relationship(back_populates="teacher")
    submissions: List["Submission"] = Relationship(back_populates="student")
    coursewares: List["Courseware"] = Relationship(back_populates="teacher")
    chats: List["ChatHistory"]   = Relationship(back_populates="student")
    practices: List["Practice"]  = Relationship(back_populates="student")


class Exercise(SQLModel, table=True):
    __tablename__ = "exercise"
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int   = Field(foreign_key="user.id", nullable=False)
    subject: Optional[str] = Field(max_length=100, nullable=True)

    prompt: Any = Field(
        sa_column=Column(JSON),
        default_factory=list
    )
    answers: Any = Field(
        sa_column=Column(JSON),
        default_factory=dict
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)

    teacher: User               = Relationship(back_populates="exercises")
    homeworks: List["Homework"] = Relationship(back_populates="exercise")


class Homework(SQLModel, table=True):
    __tablename__ = "homework"
    id: Optional[int] = Field(default=None, primary_key=True)
    exercise_id: int  = Field(foreign_key="exercise.id", nullable=False)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)

    exercise: Exercise            = Relationship(back_populates="homeworks")
    submissions: List["Submission"] = Relationship(back_populates="homework")


class Submission(SQLModel, table=True):
    __tablename__ = "submission"

    id: Optional[int] = Field(default=None, primary_key=True)
    homework_id: int  = Field(foreign_key="homework.id", nullable=False)
    student_id: int   = Field(foreign_key="user.id", nullable=False)

    answers: Any = Field(sa_column=Column(JSON), default_factory=dict)
    score: int = Field(default=0)
    status: str = Field(default="grading")
    feedback: Any = Field(sa_column=Column(JSON), default_factory=dict)

    submitted_at: datetime = Field(default_factory=datetime.utcnow)

    homework: "Homework"      = Relationship(back_populates="submissions")
    student:  "User"          = Relationship(back_populates="submissions")


class Courseware(SQLModel, table=True):
    """
    教师课件表：存储已保存的备课内容，以及可选的 PDF 二进制
    """
    __tablename__ = "courseware"

    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int   = Field(foreign_key="user.id", nullable=False)
    topic: str        = Field(max_length=255)
    # 去掉 nullable，只保留 sa_column
    markdown: str     = Field(sa_column=Column(JSON))
    pdf: Optional[bytes] = Field(
        sa_column=Column("pdf", LargeBinary)
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    teacher: User = Relationship(back_populates="coursewares")


class ChatHistory(SQLModel, table=True):
    __tablename__ = "chat_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="user.id", nullable=False)
    question: str
    answer: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    student: "User" = Relationship(back_populates="chats")


class Practice(SQLModel, table=True):
    __tablename__ = "practice"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="user.id", nullable=False)
    topic: str = Field(max_length=255)
    questions: Any = Field(sa_column=Column(JSON), default_factory=list)
    answers: Any = Field(sa_column=Column(JSON), default_factory=dict)
    student_answers: Any = Field(sa_column=Column(JSON), default_factory=dict)
    feedback: Any = Field(sa_column=Column(JSON), default_factory=dict)
    score: int = Field(default=0)
    status: str = Field(default="not_submitted")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    student: "User" = Relationship(back_populates="practices")
