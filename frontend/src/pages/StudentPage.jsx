// src/pages/StudentPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

export default function StudentPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login");
  };
  return (
    <div className="container">
      <div className="card">
        <div style={{ textAlign: "right" }}>
          您好，同学{username}
          <button
            className="button"
            style={{ width: "auto", marginLeft: "1rem" }}
            onClick={logout}
          >
            登出
          </button>
        </div>
        <h2>学生中心</h2>
        <div className="actions">
          <button className="button" onClick={() => navigate("homeworks")}>我的作业</button>
          <button className="button" onClick={() => navigate("ai")}>AI教师</button>
          <button className="button" onClick={() => navigate("evaluate")}>评测助手</button>
        </div>
      </div>
    </div>
  );
}
