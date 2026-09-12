import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import MyLoadsDevices from './pages/MyLoadsDevices';
import ScheduleRecommendations from './pages/ScheduleRecommendations';
import ImpactRewards from './pages/ImpactRewards';

function AdminGridPlaceholder() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl border border-surface-variant text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-space-md text-primary-container">
        <span className="material-symbols-outlined text-[32px]">tune</span>
      </div>
      <h2 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">Admin Grid Dispatch Control</h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
        Aggregate regional node telemetry, reserve margins, and wholesale curtailment triggers.
      </p>
    </div>
  );
}

function ProfileSettingsPlaceholder() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl border border-surface-variant text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-space-md text-primary-container">
        <span className="material-symbols-outlined text-[32px]">settings</span>
      </div>
      <h2 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">Facility Profile &amp; Settings</h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
        Manage facility electrical limits, utility meter credentials, and webhook alert preferences.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing Landing Page (The Main Page) */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication Pages */}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/register" element={<SignUp />} />

        {/* In-App Authenticated Console Routes */}
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="my-loads-devices" element={<MyLoadsDevices />} />
          <Route path="schedule-recommendations" element={<ScheduleRecommendations />} />
          <Route path="impact" element={<ImpactRewards />} />
          <Route path="rewards-flexcoins" element={<ImpactRewards />} />
          <Route path="admin-grid" element={<AdminGridPlaceholder />} />
          <Route path="profile-settings" element={<ProfileSettingsPlaceholder />} />
        </Route>

        {/* Fallback to Main Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
