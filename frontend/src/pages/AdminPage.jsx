import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminUsers from './AdminUsers';
import AdminCoursewares from './AdminCoursewares';
import AdminDashboard from './AdminDashboard';

export default function AdminPage() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="users" element={<AdminUsers />} />
        <Route path="coursewares" element={<AdminCoursewares />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
