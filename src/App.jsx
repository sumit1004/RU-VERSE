import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCategories from './pages/admin/AdminCategories';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventCreate from './pages/admin/AdminEventCreate';
import AdminEventEdit from './pages/admin/AdminEventEdit';
import AdminEventDetail from './pages/admin/AdminEventDetail';
import AdminFormBuilder from './pages/admin/AdminFormBuilder';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminRegistrationDetail from './pages/admin/AdminRegistrationDetail';
import AdminCoordinators from './pages/admin/AdminCoordinators';
import AdminCoordinatorDetail from './pages/admin/AdminCoordinatorDetail';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import PublicWebsite from './pages/public/PublicWebsite';
import PublicEventDetail from './pages/public/PublicEventDetail';
import PublicRegistration from './pages/public/PublicRegistration';
import RegistrationSuccess from './pages/public/RegistrationSuccess';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 1. Public Cinematic RU VERSE Experience */}
          <Route path="/" element={<PublicWebsite />} />

          {/* 2. Public Event Details & Registration Routes */}
          <Route path="/events/:slug" element={<PublicEventDetail />} />
          <Route path="/events/:slug/register" element={<PublicRegistration />} />
          <Route path="/registration/success/:registrationNumber" element={<RegistrationSuccess />} />

          {/* 3. Admin Authentication */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* 4. Protected Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            
            {/* Category Management */}
            <Route
              path="categories"
              element={
                <ProtectedRoute requiredPermission="categories.view">
                  <AdminCategories />
                </ProtectedRoute>
              }
            />

            {/* Event Management */}
            <Route
              path="events"
              element={
                <ProtectedRoute requiredPermission="events.view">
                  <AdminEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="events/create"
              element={
                <ProtectedRoute requiredPermission="events.create">
                  <AdminEventCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="events/:id"
              element={
                <ProtectedRoute requiredPermission="events.view">
                  <AdminEventDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="events/:id/edit"
              element={
                <ProtectedRoute requiredPermission="events.edit">
                  <AdminEventEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="events/:id/form"
              element={
                <ProtectedRoute requiredPermission="forms.view">
                  <AdminFormBuilder />
                </ProtectedRoute>
              }
            />

            {/* Registration Management (Phase 6) */}
            <Route
              path="registrations"
              element={
                <ProtectedRoute requiredPermission="registrations.view">
                  <AdminRegistrations />
                </ProtectedRoute>
              }
            />
            <Route
              path="registrations/:id"
              element={
                <ProtectedRoute requiredPermission="registrations.view">
                  <AdminRegistrationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="events/:eventId/registrations"
              element={
                <ProtectedRoute requiredPermission="registrations.view">
                  <AdminRegistrations />
                </ProtectedRoute>
              }
            />

            {/* Coordinator Management (Phase 8 & 9) */}
            <Route
              path="coordinators"
              element={
                <ProtectedRoute requiredPermission="coordinators.view">
                  <AdminCoordinators />
                </ProtectedRoute>
              }
            />
            <Route
              path="coordinators/:id"
              element={
                <ProtectedRoute requiredPermission="coordinators.view">
                  <AdminCoordinatorDetail />
                </ProtectedRoute>
              }
            />

            {/* Audit Logs (Phase 9) */}
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute requiredPermission="audit.view">
                  <AdminAuditLogs />
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
