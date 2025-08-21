import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedBackground from "../components/AnimatedBackground";
import "../ui/layout.css";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username") || "";
  const MotionBox = motion.div;

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
          <div className="avatar-mini">{(username || "A").slice(0, 1)}</div>
          {!collapsed && <div className="user-text">您好，管理员{username}</div>}
        </div>

        <nav className="sb-nav">
          <button className="sb-item" onClick={() => nav("/admin/users")}>
            <span className="sb-ico">👥</span>
            {!collapsed && <span>用户管理</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/admin/coursewares")}>
            <span className="sb-ico">📚</span>
            {!collapsed && <span>课件管理</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/admin/public_docs")}>
            <span className="sb-ico">📁</span>
            {!collapsed && <span>公共资料库</span>}
          </button>
          <button className="sb-item" onClick={() => nav("/admin/dashboard")}>
            <span className="sb-ico">📊</span>
            {!collapsed && <span>数据概览</span>}
          </button>
        </nav>

        <div className="sb-bottom">
          <button className="logout" onClick={logout}>
            <span className="sb-ico">⎋</span>
            {!collapsed && <span>登出</span>}
          </button>
        </div>
      </aside>

      <main className={`app-main ${collapsed ? "shift-collapsed" : "shift-open"}`}>
        <AnimatedBackground />
        <AnimatePresence mode="wait">
          <MotionBox
            key={location.pathname}
            className="page-shell"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </MotionBox>
        </AnimatePresence>
      </main>
    </>
  );
}
