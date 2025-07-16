# backend/models.py
from typing import Optional, Any, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON, LargeBinary, Text, Enum

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
    documents: List["Document"]  = Relationship(back_populates="owner")
    chats: List["ChatHistory"]   = Relationship(back_populates="student")
    practices: List["Practice"]  = Relationship(back_populates="student")
    teaching_classes: List["Class"] = Relationship(back_populates="teacher")
    class_memberships: List["ClassStudent"] = Relationship(back_populates="student")
    analyses: List["StudentAnalysis"] = Relationship(
        back_populates="student",
        sa_relationship_kwargs={"foreign_keys": "StudentAnalysis.student_id"},
    )
    analyses_for_teacher: List["StudentAnalysis"] = Relationship(
        back_populates="teacher",
        sa_relationship_kwargs={"foreign_keys": "StudentAnalysis.teacher_id"},
    )


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
    class_id: Optional[int] = Field(default=None, foreign_key="class.id")
    assigned_at: datetime = Field(default_factory=datetime.utcnow)

    exercise: Exercise            = Relationship(back_populates="homeworks")
    submissions: List["Submission"] = Relationship(back_populates="homework")
    class_: Optional["Class"]     = Relationship(back_populates="homeworks")


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
    prep_start: Optional[datetime] = Field(default=None)
    prep_end: Optional[datetime] = Field(default=None)

    teacher: User = Relationship(back_populates="coursewares")


class ChatHistory(SQLModel, table=True):
    __tablename__ = "chat_history"
    __table_args__ = {"mysql_charset": "utf8mb4"}

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="user.id", nullable=False)
    question: str = Field(sa_column=Column(Text(collation="utf8mb4_unicode_ci")))
    answer: str = Field(sa_column=Column(Text(collation="utf8mb4_unicode_ci")))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    student: "User" = Relationship(back_populates="chats")


class ChatSession(SQLModel, table=True):
    __tablename__ = "chat_session"
    __table_args__ = {"mysql_charset": "utf8mb4"}

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="user.id", nullable=False)
    title: str = Field(max_length=255, default="New Chat")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    student: "User" = Relationship()
    messages: List["ChatMessage"] = Relationship(back_populates="session")


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_message"
    __table_args__ = {"mysql_charset": "utf8mb4"}

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="chat_session.id", nullable=False)
    role: str = Field(max_length=20)
    content: str = Field(sa_column=Column(Text(collation="utf8mb4_unicode_ci")))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    session: ChatSession = Relationship(back_populates="messages")


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


class Document(SQLModel, table=True):
    __tablename__ = "document"

    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    filename: str = Field(max_length=255)
    filepath: str = Field(max_length=500)
    is_active: bool = Field(default=False)
    is_public: bool = Field(default=False)
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    owner: "User" = Relationship(back_populates="documents")
    vectors: List["DocumentVector"] = Relationship(back_populates="document")


class DocumentVector(SQLModel, table=True):
    __tablename__ = "document_vector"

    id: Optional[int] = Field(default=None, primary_key=True)
    doc_id: int = Field(foreign_key="document.id")
    chunk_index: int = Field()
    vector_blob: bytes = Field(sa_column=Column(LargeBinary))

    document: Document = Relationship(back_populates="vectors")


class StudentAnalysis(SQLModel, table=True):
    __tablename__ = "student_analysis"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="user.id", nullable=False)
    teacher_id: Optional[int] = Field(default=None, foreign_key="user.id")
    content: str = Field(sa_column=Column(Text(collation="utf8mb4_unicode_ci")))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    student: "User" = Relationship(
        back_populates="analyses",
        sa_relationship_kwargs={"foreign_keys": "StudentAnalysis.student_id"},
    )
    teacher: Optional["User"] = Relationship(
        back_populates="analyses_for_teacher",
        sa_relationship_kwargs={"foreign_keys": "StudentAnalysis.teacher_id"},
    )


class LoginEvent(SQLModel, table=True):
    __tablename__ = "login_event"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship()


class Class(SQLModel, table=True):
    __tablename__ = "class"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    subject: str = Field(sa_column=Column(Enum(
        "语文","数学","英语","物理","化学","地理","生物","历史","政治",
        name="subject_enum"
    )))
    teacher_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    teacher: "User" = Relationship(back_populates="teaching_classes")
    students: List["ClassStudent"] = Relationship(back_populates="class_")
    homeworks: List["Homework"] = Relationship(back_populates="class_")


class ClassStudent(SQLModel, table=True):
    __tablename__ = "class_student"

    class_id: int = Field(foreign_key="class.id", primary_key=True)
    student_id: int = Field(foreign_key="user.id", primary_key=True)

    class_: Class = Relationship(back_populates="students")
    student: User = Relationship(back_populates="class_memberships")
