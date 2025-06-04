# backend/main.py

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.auth import router as auth_router
from backend.lesson import router as lesson_router

app = FastAPI()

# 1. CORS（开发阶段全开；生产环境按需配置）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 注册后端 API 路由
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(lesson_router, prefix="/lesson", tags=["lesson"])

# 3. 挂载静态资源到 /static（前端打包结果放在 backend/static/）
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# 4. 健康检查路由（可选）
@app.get("/ping")
async def ping():
    return {"msg": "pong"}

# 5. 兜底路由：其它 GET 请求直接返回前端 index.html（前端 SPA）
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str, request: Request):
    # 如果以下前缀之一，抛 404，让 FastAPI/StaticFiles 处理：
    # - docs、openapi.json、redoc（FastAPI 文档）
    # - static（静态资源）
    # - auth、lesson、ping（已注册的后端 API）
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

    # 其它路径都返回前端 index.html
    return FileResponse("backend/static/index.html")
