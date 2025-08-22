import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../ui/layout.css";
import logo1 from "../pics/suda.png";
import logo2 from "../pics/ruijie.png";
import logo3 from "../pics/weilai.png";   // 你刚才上传的未来 logo
import AIEduConstellation from "./AIEduConstellation";
export default function StudentLayout() {
  const [collapsed, setCollapsed] = useState(false);   // 折叠/展开
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username") || "";
  const isAiPage = location.pathname.startsWith("/student/ai");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const nav = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* 左侧侧边栏（与 TeacherLayout 同款样式类名） */}
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
          <div className="avatar-mini">{(username || "S").slice(0, 1)}</div>
          {!collapsed && <div className="user-text">您好，同学{username}</div>}
        </div>

        <nav className="sb-nav">
          <button className="sb-item" onClick={() => nav("/student/homeworks")}>
            <span className="sb-ico">📝</span>
            {!collapsed && <span>我的作业</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/student/classes")}>
            <span className="sb-ico">🏫</span>
            {!collapsed && <span>我的班级</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/student/ai")}>
            <span className="sb-ico">🤖</span>
            {!collapsed && <span>AI教师</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/student/evaluate")}>
            <span className="sb-ico">🧪</span>
            {!collapsed && <span>评测助手</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/student/self_practice")}>
            <span className="sb-ico">🎯</span>
            {!collapsed && <span>我的随练</span>}
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

      {/* 主内容：与 TeacherLayout 同步的位移与壳层；AI页保留全屏特性 */}
      <main className={`app-main ${collapsed ? "shift-collapsed" : "shift-open"} ${isAiPage ? "ai-page" : ""}`}>
          <AIEduConstellation />
          <div className="bg-aurora" />
          <div className="bg-grid" />
        {isAiPage ? (
          // 保持 AI 页原样（不包裹外层卡片）
          <Outlet />
        ) : (
          <div className="page-shell">
            <Outlet />
          </div>
        )}
      </main>
    </>
  );
}
