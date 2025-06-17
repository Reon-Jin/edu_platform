// src/pages/StudentPage.jsx
import React from 'react';
import { useNavigate } from "react-router-dom";

export default function StudentPage() {
  const navigate = useNavigate();
  return (
    <div>
      <h2>学生页面</h2>
      <button onClick={() => navigate("homeworks")}>我的作业</button>
      <button onClick={() => navigate("ai")}>AI教师</button>
      <button onClick={() => navigate("evaluate")}>评测助手</button>
    </div>
  );
}
