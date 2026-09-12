import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import MyLoadsDevices from './pages/MyLoadsDevices';
import ScheduleRecommendations from './pages/ScheduleRecommendations';
import ImpactRewards from './pages/ImpactRewards';
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

            {/* Public-Only Authentication Pages (redirects to /dashboard if logged in) */}
            <Route
              path="/sign-in"
              element={
                <ProtectedRoute publicOnly>
                  <SignIn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <ProtectedRoute publicOnly>
                  <SignIn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sign-up"
              element={
                <ProtectedRoute publicOnly>
                  <SignUp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/register"
              element={
                <ProtectedRoute publicOnly>
                  <SignUp />
                </ProtectedRoute>
              }
            />

            {/* In-App Authenticated Console Routes */}
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
              <Route path="impact" element={<ImpactRewards />} />
              <Route path="rewards-flexcoins" element={<ImpactRewards />} />
              <Route
                path="admin-grid"
                element={
                  <ProtectedRoute requireAdmin>
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
