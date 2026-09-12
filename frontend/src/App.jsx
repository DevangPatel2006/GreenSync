import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
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
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="my-loads-devices" element={<MyLoadsDevices />} />
          <Route path="schedule-recommendations" element={<ScheduleRecommendations />} />
          <Route path="impact" element={<ImpactRewards />} />
          <Route path="rewards-flexcoins" element={<ImpactRewards />} />
          <Route path="admin-grid" element={<AdminGridPlaceholder />} />
          <Route path="profile-settings" element={<ProfileSettingsPlaceholder />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
