import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "../index.css";

export default function StudentLayout() {
  const [open, setOpen] = useState(false);
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
    setOpen(false);
  };

  return (
    <>
      <button
        className={`toggle-btn${open ? " shifted" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {open ? "\u25C0" : "\u25B6"}
      </button>
      <div className={`sidebar${open ? " open" : ""}`}>
        <div style={{ marginBottom: "1rem" }}>您好，同学{username}</div>
        <button className="button" onClick={() => nav("/student/homeworks")}>我的作业</button>
        <button className="button" onClick={() => nav("/student/classes")}>我的班级</button>
        <button className="button" onClick={() => nav("/student/ai")}>AI教师</button>
        <button className="button" onClick={() => nav("/student/evaluate")}>评测助手</button>
        <button className="button" onClick={() => nav("/student/self_practice")}>我的随练</button>
        <div style={{ flex: 1 }} />
        <button className="button logout-btn" onClick={logout}>登出</button>
      </div>
      <div className={`main-content${open ? " shifted" : ""}`}>
        <Outlet />
      </div>
    </>
  );
}
