import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import '../ui/layout.css';

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const nav = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <button
        className={`toggle-btn${open ? ' shifted' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {open ? '\u25C0' : '\u25B6'}
      </button>
      <div className={`sidebar${open ? ' open' : ''}`}>
        <div style={{ marginBottom: '1rem' }}>您好，管理员{username}</div>
        <button className="button" onClick={() => nav('/admin/users')}>用户管理</button>
        <button className="button" onClick={() => nav('/admin/coursewares')}>课件管理</button>
        <button className="button" onClick={() => nav('/admin/public_docs')}>公共资料库</button>
        <button className="button" onClick={() => nav('/admin/dashboard')}>数据概览</button>
        <div style={{ flex: 1 }} />
        <button className="button logout-btn" onClick={logout}>登出</button>
      </div>
      <div className={`main-content${open ? ' shifted' : ''}`}>
        <Outlet />
      </div>
    </>
  );
}
