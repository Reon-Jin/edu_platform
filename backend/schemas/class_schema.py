from typing import List
from datetime import datetime
from pydantic import BaseModel

class ClassCreateRequest(BaseModel):
    name: str
    capacity: int = 60
    code: str

class ClassMeta(BaseModel):
    id: int
    name: str
    capacity: int
    code: str

    class Config:
        from_attributes = True

class ClassStudentMeta(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True
