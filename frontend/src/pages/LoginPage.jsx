// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { login } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import "../index.css";        // 全局样式（保持）
import "../ui/login.css";     // 登录页专用样式（含动画）
import AIEduConstellation from "./AIEduConstellation";
import ShootingStars from "./ShootingStars";
export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { access_token, role } = await login(form);
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", form.username);

      if (role === "teacher") navigate("/teacher");
      else if (role === "admin") navigate("/admin");
      else navigate("/student");
    } catch (err) {
      setError("用户名或密码错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 动画背景层 */}
      <div className="login-bg" aria-hidden="true">
        <div className="bg-aurora" />
        <div className="bg-grid" />
        <AIEduConstellation />
        <ShootingStars count={16} speed={0.8} />
        <div className="bg-dots">
          {/* 14 个“节点” */}
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} style={{ "--i": i }} />
          ))}
        </div>
      </div>

      {/* 登录卡片 */}
      <div className="login-card">
        <h2>登录</h2>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            用户名
            <input
              className="login-input"
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
              className="login-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="请输入密码"
            />
          </label>
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </button>
        </form>
        <Link className="login-link" to="/register">
          还没有账号？立即注册
        </Link>
      </div>
    </div>
  );
}
