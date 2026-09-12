import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProfileSettings() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || 'Alex Mercer');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await updateProfile({ name: name.trim() });
      showToast(res?.message || 'Profile name updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/sign-in');
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-space-lg border-b border-surface-variant gap-space-sm mb-space-lg">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span>Account Management</span>
            <span>•</span>
            <span className="text-secondary font-title-sm">Facility Operator</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-primary-container mt-0.5 tracking-tight">
            Profile &amp; Settings
          </h1>
        </div>

        <button
          type="button"
          className="px-4 py-2 rounded border border-surface-variant text-on-surface font-title-sm text-title-sm hover:border-error hover:text-error transition-colors flex items-center gap-space-xs"
          onClick={handleLogout}
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>

      <div className="flex flex-col gap-space-lg">
        {/* Profile Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-lg">
          <div className="flex items-center gap-space-md pb-space-md border-b border-surface-variant mb-space-md">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[32px]">person</span>
            </div>
            <div>
              <h2 className="font-title-lg text-title-lg text-primary-container">{user?.name || 'Alex Mercer'}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-container text-on-secondary-fixed border border-secondary-fixed-dim font-semibold capitalize">
                  {user?.role || 'operator'}
                </span>
                <span className="text-on-surface-variant text-body-sm font-body-sm">• {user?.email || 'alex.mercer@greensync.internal'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-space-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Name field (editable per API contract) */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="profile-name">
                  Full Name / Contact
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-space-md py-2.5 rounded-lg border border-surface-variant bg-surface text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="Your full name"
                />
              </div>

              {/* Email field (read-only per API contract) */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="profile-email">
                  Email Address <span className="text-xs font-normal text-on-surface-variant">(read-only)</span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={user?.email || 'alex.mercer@greensync.internal'}
                  disabled
                  className="w-full px-space-md py-2.5 rounded-lg border border-surface-variant bg-surface-container text-on-surface-variant font-body-md cursor-not-allowed"
                />
              </div>

              {/* Role field (read-only) */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                  Assigned Platform Role
                </label>
                <input
                  type="text"
                  value={user?.role === 'admin' ? 'Grid Operator / System Administrator' : 'Facility Dispatch Manager'}
                  disabled
                  className="w-full px-space-md py-2.5 rounded-lg border border-surface-variant bg-surface-container text-on-surface-variant font-body-md cursor-not-allowed"
                />
              </div>

              {/* FlexCoins Balance */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                  Accrued FlexCoins Balance
                </label>
                <input
                  type="text"
                  value={`${user?.flexCoins ?? 1420} FC`}
                  disabled
                  className="w-full px-space-md py-2.5 rounded-lg border border-surface-variant bg-surface-container text-primary-container font-semibold font-body-md cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-space-sm">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95 transition-opacity flex items-center gap-space-xs"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Facility Electrical Parameters Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-lg">
          <div className="mb-space-md pb-space-sm border-b border-surface-variant">
            <h3 className="font-title-md text-title-md text-primary-container">
              Connected Facility Specifications
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Operational parameters bound to regional grid interconnection agreement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Regional Substation</span>
              <span className="font-title-md text-title-md text-on-surface block mt-1">Node #TX-8801</span>
              <span className="font-body-sm text-body-sm text-secondary font-semibold mt-0.5 block">High Wind Corridor</span>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Utility Authority</span>
              <span className="font-title-md text-title-md text-on-surface block mt-1">ERCOT West ISO</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 block">Automated Dispatch Ready</span>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Interconnection Cap</span>
              <span className="font-title-md text-title-md text-on-surface block mt-1">200A • 48.0 kW</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 block">Smart Breaker Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 transition-all duration-300">
          <div className="bg-primary-container text-on-primary px-4 py-3 rounded-lg shadow-md flex items-center gap-space-sm border border-secondary">
            <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
            <span className="font-title-sm text-title-sm">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
