// src/routes/AppRouter.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import TeacherLesson from "../pages/TeacherLesson";
import StudentHomeworks from "../pages/StudentHomeworks";
import AdminDashboard from "../pages/AdminDashboard";

/**
 * 受保护路由：检查是否已登录且角色匹配
 */
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
    <BrowserRouter>
      <Routes>
        {/* 根路径直接跳登录 */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 公共页面 */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 教师视图 */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <Routes>
                <Route path="lesson" element={<TeacherLesson />} />
                <Route path="*" element={<Navigate to="lesson" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* 学生视图 */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Routes>
                <Route path="homeworks" element={<StudentHomeworks />} />
                <Route path="*" element={<Navigate to="homeworks" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* 管理员视图 */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* 兜底未匹配路由，跳回登录 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
