from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.auth import router as auth_router
from backend.lesson import router as lesson_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(lesson_router, prefix="/lesson", tags=["lesson"])

app.mount("/static", StaticFiles(directory="backend/static"), name="static")

@app.get("/ping")
async def ping():
    return {"msg": "pong"}

@app.get("/{full_path:path}")
async def spa_fallback(full_path: str, request: Request):
    if (
        full_path.startswith("docs")
        or full_path.startswith("openapi.json")
        or full_path.startswith("redoc")
        or full_path.startswith("static")
        or full_path.startswith("auth")
        or full_path.startswith("lesson")
        or full_path.startswith("ping")
    ):
        raise HTTPException(status_code=404)
    return FileResponse("backend/static/index.html")
