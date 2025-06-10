// src/api/api.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000", // 填后端实际端口
  withCredentials: false,          // 如无需跨域 cookies，可去掉
});

// 自动注入 Authorization
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default instance;
