// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { login } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import "../index.css"; // 全局样式

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // 1. 登录，拿到 token 和 role
      const { access_token, role } = await login(form);
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", role);

      // 2. 根据角色跳转
      if (role === "teacher") {
        navigate("/teacher/lesson");
      } else if (role === "student") {
        navigate("/student/homeworks");
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        setError("未知角色，无法跳转");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "登录失败，请检查用户名和密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>登录</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            用户名
            <input
              className="input"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="请输入用户名"
            />
          </label>
          <label>
            密码
            <input
              className="input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="请输入密码"
            />
          </label>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </button>
        </form>
        <Link className="link" to="/register">
          还没有账号？立即注册
        </Link>
      </div>
    </div>
  );
}
