import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import MyLoadsDevices from './pages/MyLoadsDevices';
import ScheduleRecommendations from './pages/ScheduleRecommendations';
import Impact from './pages/Impact';
import Rewards from './pages/Rewards';
import AdminGridDashboard from './pages/AdminGridDashboard';
import ProfileSettings from './pages/ProfileSettings';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing Landing Page (The Main Page) */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Authentication Pages (Redirect authenticated users to /dashboard) */}
            <Route
              path="/sign-in"
              element={
                <PublicOnlyRoute>
                  <SignIn />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <SignIn />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/sign-up"
              element={
                <PublicOnlyRoute>
                  <SignUp />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <SignUp />
                </PublicOnlyRoute>
              }
            />

            {/* In-App Authenticated Console Routes (Guarded by ProtectedRoute) */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-loads-devices" element={<MyLoadsDevices />} />
              <Route path="schedule-recommendations" element={<ScheduleRecommendations />} />
              <Route path="impact" element={<Impact />} />
              <Route path="rewards-flexcoins" element={<Rewards />} />
              <Route path="rewards" element={<Rewards />} />
              <Route
                path="admin-grid"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminGridDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="profile-settings" element={<ProfileSettings />} />
            </Route>

            {/* Fallback to Main Landing Page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
