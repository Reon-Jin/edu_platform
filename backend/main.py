from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from backend.config import engine
from backend.auth import router as auth_router
from backend.routers.lesson_router import router as lesson_router
from backend.routers.exercise_router import router as exercise_router
from backend.routers.homework_router import router as homework_router
from backend.routers.teacher_router import router as teacher_student_router
from backend.routers.student_router import router, router_practice, router_analysis
from backend.routers.admin_router import router as admin_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

app.include_router(auth_router, prefix="/auth")
app.include_router(lesson_router)
app.include_router(exercise_router)
app.include_router(homework_router)
app.include_router(teacher_student_router)
app.include_router(router)
app.include_router(router_practice)
app.include_router(router_analysis)
app.include_router(admin_router)

app.mount("/static", StaticFiles(directory="backend/static"), name="static")

@app.get("/ping")
async def ping():
    return {"msg": "pong"}

@app.get("/{full_path:path}")
async def spa_fallback(full_path:str, request:Request):
    if full_path.startswith(("docs","openapi.json","redoc",
                             "static","auth","lesson","teacher","student","admin","ping")):
        raise HTTPException(404)
    return FileResponse("backend/static/index.html")
