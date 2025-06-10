// src/api/auth.js
import api from "./api";

/**
 * 登录（OAuth2 Password 模式）
 * 后端 expect: application/x-www-form-urlencoded
 * 返回 { access_token, token_type, role }
 */
export async function login({ username, password }) {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);

  const resp = await api.post(
    "/auth/token",
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  // resp.data = { access_token, token_type, role }
  return resp.data;
}

/**
 * 注册
 * 返回 { id, username, role }
 */
export async function register({ username, password, role }) {
  const resp = await api.post("/auth/register", { username, password, role });
  return resp.data;
}

/**
 * 获取当前用户信息（角色等）
 * 可选使用，后端在 /auth/me 返回 { id, username, role }
 */
export async function fetchProfile() {
  const resp = await api.get("/auth/me");
  return resp.data;  // { id, username, role }
}
