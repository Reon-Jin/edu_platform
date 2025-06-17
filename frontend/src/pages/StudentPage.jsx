// src/pages/StudentPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

export default function StudentPage() {
  const navigate = useNavigate();
  return (
    <div className="container">
      <div className="card">
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
