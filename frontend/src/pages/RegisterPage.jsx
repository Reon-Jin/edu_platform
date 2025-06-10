// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { register } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import "../index.css";

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
      setError(err.response?.data?.detail || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>注册</h2>
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
          <label>
            角色
            <select
              className="input"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="student">学生</option>
              <option value="teacher">教师</option>
              <option value="admin">管理员</option>
            </select>
          </label>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "注册中…" : "注册"}
          </button>
        </form>
        <Link className="link" to="/login">
          已有账号？立即登录
        </Link>
      </div>
    </div>
  );
}
