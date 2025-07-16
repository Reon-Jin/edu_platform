import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminUsers from './AdminUsers';
import AdminCoursewares from './AdminCoursewares';
import AdminCoursewareEdit from './AdminCoursewareEdit';
import AdminDashboard from './AdminDashboard';
import AdminPublicDocs from './AdminPublicDocs';

export default function AdminPage() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="users" element={<AdminUsers />} />
        <Route path="coursewares" element={<AdminCoursewares />} />
        <Route path="courseware/:id/edit" element={<AdminCoursewareEdit />} />
        <Route path="public_docs" element={<AdminPublicDocs />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
