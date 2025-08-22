// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { login } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import "../index.css";
import "../ui/login.css";
import AIEduConstellation from "./AIEduConstellation";
import ShootingStars from "./ShootingStars";

// 三个 logo
import logo1 from "../pics/suda.png";
import logo2 from "../pics/ruijie.png";
import logo3 from "../pics/weilai.png";   // 请确保文件存在

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
    } catch {
      setError("用户名或密码错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 背景动效 */}
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

      {/* 登录卡片 */}
      <div className="login-card">
        {/* 顶部品牌强调条 */}
        <div className="brand-accent" aria-hidden="true" />

        {/* 抬头栏 */}
        <div className="card-header" role="banner">
          <div className="card-logos" aria-label="合作单位">
            <img src={logo1} alt="Soochow University" className="card-logo suda-logo" />
            <span className="logo-divider" aria-hidden="true" />
            <img src={logo2} alt="Ruijie" className="card-logo" />
            <span className="logo-divider" aria-hidden="true" />
            <img src={logo3} alt="Weilai" className="card-logo" />
          </div>
          <div className="card-titles">
            <h1 className="product-title">AI教育平台</h1>
            <p className="product-subtitle">AI EDUCATION PLATFORM</p>
          </div>
          <div className="title-glow" aria-hidden="true" />
        </div>

        {/* 分隔线 */}
        <div className="card-rule" aria-hidden="true" />

        <h2 className="section-title">登录</h2>
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span className="field-label">用户名</span>
            <input
              className="login-input"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </label>

          <label className="field">
            <span className="field-label">密码</span>
            <input
              className="login-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="请输入密码"
              autoComplete="current-password"
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
