// src/pages/TeacherPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

export default function TeacherPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handlePrepare = () => {
    navigate("/teacher/lesson");  // 跳转到备课页面
  };

  const handleLessonList = () => {
    navigate("/teacher/lesson/list");  // 跳转到课程列表页面
  };

  const handleExercise = () => {
    navigate("/teacher/exercise");
  };

  const handleExerciseList = () => {
    navigate("/teacher/exercise/list");
  };

  const handleStudentData = () => {
    navigate("/teacher/students");
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ textAlign: "right" }}>
          您好，教师{username}
          <button
            className="button"
            style={{ width: "auto", marginLeft: "1rem" }}
            onClick={logout}
          >
            登出
          </button>
        </div>
        <h2>教师中心</h2>
        <div className="actions">
          <button className="button" onClick={handlePrepare}>
            备课
          </button>
          <button className="button" onClick={handleLessonList}>
            课程列表
          </button>
          <button className="button" onClick={handleExercise}>
            练习生成
          </button>
          <button className="button" onClick={handleExerciseList}>
            练习列表
          </button>
          <button className="button" onClick={handleStudentData}>
            学情数据
          </button>
        </div>
      </div>
    </div>
  );
}
