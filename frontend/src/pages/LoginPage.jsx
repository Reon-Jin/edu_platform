// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { login } from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      alert('用户名和密码都不能为空');
      return;
    }
    try {
      const res = await login(form);
      const role = res.data.role;
      // 根据角色跳转
      if (role === 'student') navigate('/student');
      else if (role === 'teacher') navigate('/teacher');
      else if (role === 'admin') navigate('/admin');
      else alert('未知角色，无法跳转');
    } catch (err) {
      console.error(err);
      alert('登录失败，请检查用户名和密码');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2 style={{ textAlign: 'center' }}>登录</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          name="username"
          placeholder="用户名"
          value={form.username}
          onChange={handleChange}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        <input
          name="password"
          type="password"
          placeholder="密码"
          value={form.password}
          onChange={handleChange}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" style={{ padding: '0.75rem', fontSize: '1rem', cursor: 'pointer' }}>
          登录
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        还没有账号？<a href="/register">注册</a>
      </p>
    </div>
  );
}
