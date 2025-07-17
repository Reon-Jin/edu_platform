# backend/schemas/submission_schema.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any, Optional, List
from .exercise_schema import ExerciseOut

class SubmitRequest(BaseModel):
    answers: Dict[str, Any]

class SubmissionStatusOut(BaseModel):
    submission_id: int = Field(..., description="提交记录 ID")
    status: str        = Field(..., description="批改状态：grading 或 completed")

    class Config:
        from_attributes = True

class HomeworkStudentOut(BaseModel):
    homework_id: int
    exercise_id: int
    assigned_at: datetime
    status: str                    # "not_submitted"/"grading"/"completed"
    submission_id: Optional[int]
    subject: Optional[str] = None

    class Config:
        from_attributes = True

class HomeworkResultOut(BaseModel):
    exercise: ExerciseOut         # 练习题内容
    student_answers: Dict[str, Any]
    feedback: Dict[str, Any]      # 大模型解析：results & explanations
    score: int
    total_score: int

    class Config:
        from_attributes = True
