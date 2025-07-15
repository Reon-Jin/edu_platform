import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "../index.css";

export default function TeacherLayout() {
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
        className={`button toggle-btn${open ? " shifted" : ""}`}
        onClick={() => setOpen(!open)}
        style={{ width: "auto" }}
      >
        菜单
      </button>
      <div className={`sidebar${open ? " open" : ""}`}>
        <div style={{ marginBottom: "1rem" }}>您好，教师{username}</div>
        <button className="button" onClick={() => nav("/teacher/lesson")}>备课</button>
        <button className="button" onClick={() => nav("/teacher/lesson/list")}>课程列表</button>
        <button className="button" onClick={() => nav("/teacher/exercise")}>练习生成</button>
        <button className="button" onClick={() => nav("/teacher/exercise/list")}>练习列表</button>
        <button className="button" onClick={() => nav("/teacher/classes")}>班级管理</button>
        <div style={{ flex: 1 }} />
        <button className="button logout-btn" onClick={logout}>登出</button>
      </div>
      <div>
        <Outlet />
      </div>
    </>
  );
}
