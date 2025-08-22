import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "../ui/layout.css";
import logo1 from "../pics/suda.png";
import logo2 from "../pics/ruijie.png";
import logo3 from "../pics/weilai.png";   // 你刚才上传的未来 logo
import AIEduConstellation from "./AIEduConstellation";
export default function TeacherLayout() {
  const [collapsed, setCollapsed] = useState(false);   // 仅折叠/展开
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const nav = (path) => {
    navigate(path);
    // 折叠逻辑不自动改变，避免“多余功能”
  };

  return (
    <>
      {/* 左侧侧边栏，仅视觉升级 */}
      <aside className={`slate-sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sb-top">
          <div className="brand">
            <div className="logo-dot" />
            {!collapsed && <span className="brand-name">EduPanel</span>}
          </div>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="折叠侧边栏"
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <div className="sb-user" title={username}>
          <div className="avatar-mini">{(username || "T").slice(0, 1)}</div>
          {!collapsed && <div className="user-text">您好，教师{username}</div>}
        </div>

        <nav className="sb-nav">
          <button className="sb-item" onClick={() => nav("/teacher/lesson")}>
            <span className="sb-ico">📘</span>
            {!collapsed && <span>备课</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/teacher/lesson/list")}>
            <span className="sb-ico">🗂️</span>
            {!collapsed && <span>课程列表</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/teacher/exercise")}>
            <span className="sb-ico">🧩</span>
            {!collapsed && <span>练习生成</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/teacher/exercise/list")}>
            <span className="sb-ico">📑</span>
            {!collapsed && <span>练习列表</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/teacher/docs")}>
            <span className="sb-ico">📁</span>
            {!collapsed && <span>资料管理</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/teacher/classes")}>
            <span className="sb-ico">🏫</span>
            {!collapsed && <span>班级管理</span>}
          </button>
        </nav>

        <div className="sb-logos">
        <img src={logo1} alt="Suda" className="sb-logo" />
        <img src={logo2} alt="Ruijie" className="sb-logo" />
        <img src={logo3} alt="Weilai" className="sb-logo" />
        </div>

        <div className="sb-bottom">
          <button className="logout" onClick={logout}>
            <span className="sb-ico">⎋</span>
            {!collapsed && <span>登出</span>}
          </button>
        </div>
      </aside>

      {/* 主内容：仍然只渲染你的子路由 */}
      <main className={`app-main ${collapsed ? "shift-collapsed" : "shift-open"}`}>
          <AIEduConstellation />
          <div className="bg-aurora" />
          <div className="bg-grid" />
        <div className="page-shell">
          <Outlet />
        </div>
      </main>
    </>
  );
}
