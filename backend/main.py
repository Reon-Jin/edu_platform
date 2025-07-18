from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session
from sqlalchemy import inspect, text
from time import perf_counter

from backend.config import engine
from backend.models import RequestMetric
from backend.auth import router as auth_router
from backend.routers.lesson_router import router as lesson_router
from backend.routers.exercise_router import router as exercise_router
from backend.routers.homework_router import router as homework_router
from backend.routers.teacher_router import router as teacher_student_router
from backend.routers.student_router import router, router_practice, router_analysis
from backend.routers.class_router import router as class_router
from backend.routers.admin_router import router as admin_router
from backend.routers.doc_router import router as doc_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


@app.middleware("http")
async def record_metrics(request: Request, call_next):
    start = perf_counter()
    response = await call_next(request)
    duration = (perf_counter() - start) * 1000
    with Session(engine) as sess:
        metric = RequestMetric(
            path=request.url.path,
            method=request.method,
            status_code=response.status_code,
            duration_ms=duration,
        )
        sess.add(metric)
        sess.commit()
    return response
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    # Ensure new columns exist when upgrading from older versions
    with engine.begin() as conn:
        insp = inspect(conn)
        if "courseware" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("courseware")}
            if "prep_start" not in cols:
                conn.execute(text("ALTER TABLE courseware ADD COLUMN prep_start DATETIME"))
            if "prep_end" not in cols:
                conn.execute(text("ALTER TABLE courseware ADD COLUMN prep_end DATETIME"))
        if "homework" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("homework")}
            if "class_id" not in cols:
                conn.execute(text("ALTER TABLE homework ADD COLUMN class_id INTEGER"))
                conn.execute(text(
                    "ALTER TABLE homework ADD CONSTRAINT homework_class_fk FOREIGN KEY(class_id) REFERENCES class(id)"
                ))

app.include_router(auth_router, prefix="/auth")
app.include_router(lesson_router)
app.include_router(exercise_router)
app.include_router(homework_router)
app.include_router(teacher_student_router)
app.include_router(class_router)
app.include_router(router)
app.include_router(router_practice)
app.include_router(router_analysis)
app.include_router(admin_router)
app.include_router(doc_router)

app.mount("/static", StaticFiles(directory="backend/static"), name="static")

@app.get("/ping")
async def ping():
    return {"msg": "pong"}

@app.get("/{full_path:path}")
async def spa_fallback(full_path:str, request:Request):
    if full_path.startswith(("docs","openapi.json","redoc",
                             "static","auth","lesson","teacher","student","classes","admin","ping")):
        raise HTTPException(404)
    return FileResponse("backend/static/index.html")
