from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any, List

class GenerateExerciseRequest(BaseModel):
    topic: str = Field(..., description="练习题主题")
    num_mcq: int = Field(0, ge=0, description="选择题数量")
    num_fill_blank: int = Field(0, ge=0, description="填空题数量")
    num_short_answer: int = Field(0, ge=0, description="简答题数量")
    num_programming: int = Field(0, ge=0, description="编程题数量")
    export_pdf: bool = Field(False, description="是否导出 PDF")

class ExerciseOut(BaseModel):
    id: int
    subject: str
    prompt: List[Dict[str, Any]]
    answers: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
