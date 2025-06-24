import os
from pathlib import Path

# Define the file path
app_router_path = Path("frontend/src/routes/AppRouter.jsx")

# Ensure directory exists
app_router_path.parent.mkdir(parents=True, exist_ok=True)

# Write the AppRouter.jsx content
app_router_content = '''
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import StudentPage from '../pages/StudentPage';
import TeacherDashboard from '../pages/TeacherDashboard';
import AdminPage from '../pages/AdminPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/student" element={<StudentPage />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
'''.strip()

with open(app_router_path, 'w', encoding='utf-8') as f:
    f.write(app_router_content)

