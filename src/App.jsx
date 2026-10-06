import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCategories from './pages/admin/AdminCategories';
import PublicWebsite from './pages/public/PublicWebsite';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 1. Public Cinematic RU VERSE Experience */}
          <Route path="/" element={<PublicWebsite />} />

          {/* 2. Admin Authentication */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* 3. Protected Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route
              path="categories"
              element={
                <ProtectedRoute requiredPermission="categories.view">
                  <AdminCategories />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
