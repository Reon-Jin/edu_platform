# backend/models.py

from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

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
