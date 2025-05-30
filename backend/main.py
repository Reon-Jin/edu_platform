# backend/main.py
from fastapi import FastAPI
from backend.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 也可以改成 ["*"] 测试用，但生产要限定域名
    allow_credentials=True,
    allow_methods=["*"],                      # 允许所有 HTTP 方法：GET, POST, ...
    allow_headers=["*"],                      # 允许所有请求头
)

# 2. 注册路由
app.include_router(auth_router, prefix="/auth")

@app.get("/")
async def root():
    return {"msg": "OK"}
