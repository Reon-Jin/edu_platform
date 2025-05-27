# backend/main.py
from fastapi import FastAPI
from backend.auth import router as auth_router

app = FastAPI()
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"msg": "OK"}
