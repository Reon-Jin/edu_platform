from pydantic import BaseModel

class TeacherSubjectAssign(BaseModel):
    subject: str

class TeacherSubjectOut(BaseModel):
    teacher_id: int
    subject: str

    class Config:
        from_attributes = True
