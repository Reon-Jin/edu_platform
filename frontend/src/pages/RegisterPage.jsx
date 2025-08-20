// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { register } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import "../index.css";        // 全局样式（保持）
import "../ui/login.css";     // 复用登录页的深色与动画样式
import AIEduConstellation from "./AIEduConstellation";
import ShootingStars from "./ShootingStars";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.detail || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 动画背景层（与登录页一致） */}
      <div className="login-bg" aria-hidden="true">
        <div className="bg-aurora" />
        <div className="bg-grid" />
        <AIEduConstellation />
        <ShootingStars count={16} speed={0.8} />
        <div className="bg-dots">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} style={{ "--i": i }} />
          ))}
        </div>
      </div>

      {/* 注册卡片（沿用 login-card / login-input / login-button / login-link / login-error） */}
      <div className="login-card">
        <h2>注册</h2>
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

          <label>
            角色
            <select
              className="login-input"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="student">学生</option>
              <option value="teacher">教师</option>
              <option value="admin">管理员</option>
            </select>
          </label>

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "注册中…" : "注册"}
          </button>
        </form>

        <Link className="login-link" to="/login">
          已有账号？立即登录
        </Link>
      </div>
    </div>
  );
}
