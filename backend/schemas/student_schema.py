from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

class AskRequest(BaseModel):
    question: str
    use_docs: bool = False

class ChatOut(BaseModel):
    id: int
    question: str
    answer: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class PracticeGenerateRequest(BaseModel):
    topic: str
    num_single_choice: int = 0
    num_multiple_choice: int = 0
    num_fill_blank: int = 0
    num_short_answer: int = 0
    num_programming: int = 0

class PracticeSubmitRequest(BaseModel):
    answers: Dict[str, Any]

class PracticeOut(BaseModel):
    id: int
    topic: str
    questions: List[Dict[str, Any]]
    answers: Dict[str, Any]
    status: str
    feedback: Optional[Dict[str, Any]] = None
    score: Optional[int] = None

    class Config:
        from_attributes = True
