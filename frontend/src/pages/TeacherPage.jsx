// src/pages/TeacherPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

export default function TeacherPage() {
  const navigate = useNavigate();

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
