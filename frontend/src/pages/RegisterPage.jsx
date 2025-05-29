// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { register } from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', role: 'student' });
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
      await register(form);
      alert('注册成功！请登录。');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('注册失败，请稍后重试');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2 style={{ textAlign: 'center' }}>注册</h2>
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
        <label>
          选择角色：
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={{ marginLeft: '0.5rem', padding: '0.5rem', fontSize: '1rem' }}
          >
            <option value="student">学生</option>
            <option value="teacher">教师</option>
            <option value="admin">管理员</option>
          </select>
        </label>
        <button type="submit" style={{ padding: '0.75rem', fontSize: '1rem', cursor: 'pointer' }}>
          注册
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        已有账号？<a href="/">去登录</a>
      </p>
    </div>
  );
}
