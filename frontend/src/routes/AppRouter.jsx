// src/routes/AppRouter.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom"; 
import LoginPage from "../pages/LoginPage";
import TeacherDashboard from "../pages/TeacherDashboard";
import TeacherLesson from "../pages/TeacherLesson";
import LessonList from "../pages/LessonList";
import LessonPreview from "../pages/LessonPreview";
import ExercisePage from "../pages/ExercisePage";
import ExerciseList from "../pages/ExerciseList";
import ExercisePreview from "../pages/ExercisePreview";
import ExerciseStats from "../pages/ExerciseStats";
import TeacherStudents from "../pages/TeacherStudents";
import TeacherStudentDetail from "../pages/TeacherStudentDetail";
import TeacherStudentHomeworkDetail from "../pages/TeacherStudentHomeworkDetail";
import RegisterPage from "../pages/RegisterPage";
import StudentPage from "../pages/StudentPage";
import StudentHomeworks from "../pages/StudentHomeworks";
import StudentHomeworkResult from "../pages/StudentHomeworkResult";
import StudentHomeworkAnswer from "../pages/StudentHomeworkAnswer";
import StudentAiTeacher from "../pages/StudentAiTeacher";
import StudentChatHistory from "../pages/StudentChatHistory";
import EvaluateAssistant from "../pages/EvaluateAssistant";
import SelfPracticeList from "../pages/SelfPracticeList";
import SelfPracticeDetail from "../pages/SelfPracticeDetail";
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
              <Route path="/" element={<TeacherDashboard />} />
              <Route path="lesson" element={<TeacherLesson />} />
              <Route path="lesson/list" element={<LessonList />} />
              <Route path="lesson/preview/:cw_id" element={<LessonPreview />} />
              <Route path="exercise" element={<ExercisePage />} />
              <Route path="exercise/list" element={<ExerciseList />} />
              <Route path="exercise/preview/:ex_id" element={<ExercisePreview />} />
              <Route path="exercise/stats/:ex_id" element={<ExerciseStats />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="students/:sid" element={<TeacherStudentDetail />} />
              <Route path="students/:sid/homework/:hw_id" element={<TeacherStudentHomeworkDetail />} />
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
              <Route path="/" element={<StudentPage />} />
              <Route path="homeworks" element={<StudentHomeworks />} />
              <Route path="homeworks/answer/:hw_id" element={<StudentHomeworkAnswer />} />
              <Route path="homeworks/result/:hw_id" element={<StudentHomeworkResult />} />
              <Route path="ai" element={<StudentAiTeacher />} />
              <Route path="ai/:sessionId" element={<StudentAiTeacher />} />
              <Route path="ai/history" element={<StudentChatHistory />} />
              <Route path="evaluate" element={<EvaluateAssistant />} />
              <Route path="self_practice" element={<SelfPracticeList />} />
              <Route path="self_practice/:id" element={<SelfPracticeDetail />} />
              <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />
      {/* 管理员视图 */}
      <Route path="/admin/*" element={<AdminPage />} />
      
      <Route path="*" element={<Navigate to="/login" replace />} />  
    </Routes>
  );
}
