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

// 全局响应拦截：未授权时跳转登录
instance.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default instance;
