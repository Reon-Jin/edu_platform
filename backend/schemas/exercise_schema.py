from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class GenerateExerciseRequest(BaseModel):
    topic: str
    num_single_choice: int = 0
    num_multiple_choice: int = 0
    num_fill_blank: int = 0
    num_short_answer: int = 0
    num_programming: int = 0
    export_pdf: bool = False


class QuestionItem(BaseModel):
    id: int | str
    question: str
    options: Optional[List[str]] = None  # 选择题时有选项字段
    # 编程题可额外有 code 用于展示


class QuestionBlock(BaseModel):
    type: str                        # e.g. "multiple_choice", "fill_in_blank"...
    items: List[QuestionItem]


class ExercisePreviewOut(BaseModel):
    topic: str
    questions: List[QuestionBlock]
    answers: Dict[str, Any]          # 键为题目 id，值为参考答案


class ExerciseOut(BaseModel):
    id: int
    teacher_id: int
    subject: str
    prompt: List[QuestionBlock]
    answers: Dict[str, Any]
    points: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class ExerciseQuestionsOut(BaseModel):
    id: int
    subject: str
    prompt: List[QuestionBlock]

    class Config:
        from_attributes = True
