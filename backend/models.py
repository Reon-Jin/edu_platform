from typing import Optional, Any, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

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

    # 学生提交的答案
    answers: Any = Field(sa_column=Column(JSON), default_factory=dict)
    # 由大模型批改后的得分
    score: int = Field(default=0)
    # 当前批改状态：grading / completed
    status: str = Field(default="grading")
    # 大模型生成的逐题解析
    feedback: Any = Field(sa_column=Column(JSON), default_factory=dict)

    submitted_at: datetime = Field(default_factory=datetime.utcnow)

    homework: "Homework"      = Relationship(back_populates="submissions")
    student:  "User"          = Relationship(back_populates="submissions")
