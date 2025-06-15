// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom"; // 不需要再使用 BrowserRouter
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TeacherPage from "./pages/TeacherPage"; // TeacherPage 路由
import TeacherLesson from "./pages/TeacherLesson";
import LessonList from "./pages/LessonList"; 
import LessonPreview from "./pages/LessonPreview";

// 受保护路由：检查是否已登录且角色匹配
function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");
  if (!token || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
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
              <Route path="/" element={<TeacherPage />} />  {/* TeacherPage 路由 */}
              <Route path="lesson" element={<TeacherLesson />} />
              <Route path="lesson/list" element={<LessonList />} />
              <Route path="lesson/preview/:cw_id" element={<LessonPreview />} />  {/* 课件预览页面 */}
              <Route path="*" element={<Navigate to="lesson" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* 学生视图 */}
      <Route path="/student/*" element={<StudentHomeworks />} />
      {/* 管理员视图 */}
      <Route path="/admin/*" element={<AdminDashboard />} />

      <Route path="*" element={<Navigate to="/login" replace />} />  {/* 未匹配的路径跳转到登录页面 */}
    </Routes>
  );
}
