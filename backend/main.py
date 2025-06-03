# backend/main.py

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware

# —— 如果 auth.py 已经定义了 router，就导入它
from backend.auth import router as auth_router
# —— 可能还有其他模块 router（例如 lesson、exam 等），按需 include

app = FastAPI()

# ——（可选）如果前后端在同一域名下，就不需要宽松的 CORS
#    这里只示例在开发阶段允许所有 origin，以防你还在 local 前端单独跑
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# —— 1. 后端 API 路由（示例：/auth）
app.include_router(auth_router, prefix="/auth", tags=["auth"])
# —— 如果还有别的后端模块，继续 include_router

# —— 2. 将本地的 backend/static 目录挂到根路径 "/"
#    html=True 会让访问 "/" 时返回 index.html
app.mount("/", StaticFiles(directory="backend/static", html=True), name="static")


# —— 3. “兜底” 路由：所有没有匹配到的 GET 请求，都返回 index.html
# ——    这样才能让前端 SPA（如 React Router/Vue Router）进行客户端路由渲染
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str, request: Request):
    return FileResponse("backend/static/index.html")
