from datetime import datetime
from pydantic import BaseModel
from .exercise_schema import ExerciseOut

class HomeworkOut(BaseModel):
    id: int
    exercise: ExerciseOut
    assigned_at: datetime

    class Config:
        from_attributes = True
