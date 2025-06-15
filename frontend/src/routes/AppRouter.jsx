// src/routes/AppRouter.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom"; 
import LoginPage from "../pages/LoginPage";
import TeacherPage from "../pages/TeacherPage"; 
import TeacherLesson from "../pages/TeacherLesson";
import LessonList from "../pages/LessonList"; 
import LessonPreview from "../pages/LessonPreview";
import RegisterPage from "../pages/RegisterPage";
import StudentHomeworks from "../pages/StudentHomeworks";
import AdminPage from "../pages/AdminPage";

// 受保护路由：检查是否已登录且角色匹配
function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");
  if (!token || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 教师视图 */}
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <Routes>
              <Route path="/" element={<TeacherPage />} />
              <Route path="lesson" element={<TeacherLesson />} />
              <Route path="lesson/list" element={<LessonList />} />
              <Route path="lesson/preview/:cw_id" element={<LessonPreview />} />  
              <Route path="*" element={<Navigate to="lesson" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />
      
      {/* 学生视图 */}
      <Route path="/student/*" element={<StudentHomeworks />} />
      {/* 管理员视图 */}
      <Route path="/admin/*" element={<AdminPage />} />
      
      <Route path="*" element={<Navigate to="/login" replace />} />  
    </Routes>
  );
}
