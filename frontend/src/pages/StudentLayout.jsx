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
        className="button toggle-btn"
        onClick={() => setOpen(!open)}
        style={{ width: "auto" }}
      >
        菜单
      </button>
      <div className={`sidebar${open ? " open" : ""}`}>
        <div style={{ marginBottom: "1rem" }}>您好，同学{username}</div>
        <button className="button" onClick={() => nav("/student/homeworks")}>我的作业</button>
        <button className="button" onClick={() => nav("/student/ai")}>AI教师</button>
        <button className="button" onClick={() => nav("/student/evaluate")}>评测助手</button>
        <button className="button" onClick={() => nav("/student/self_practice")}>我的随练</button>
        <div style={{ flex: 1 }} />
        <button className="button" onClick={logout}>登出</button>
      </div>
      <div>
        <Outlet />
      </div>
    </>
  );
}
