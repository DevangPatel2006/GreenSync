import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import { mapBackendError } from '../utils/errorMapper';

export default function ProfileSettings() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/users/profile');
        const u = res?.user || res?.data?.user || (res?.name ? res : null);
        if (u && typeof u === 'object') {
          setProfileData(u);
          if (u.name) setName(u.name);
        }
      } catch (err) {
        console.warn('Backend /api/users/profile error, falling back to session user:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await updateProfile({ name: name.trim() });
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/sign-in');
  };

  const displayUser = profileData || user || {
    name: '',
    email: '',
    role: 'residential',
    flexCoins: 0,
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header pattern matching Dashboard.jsx & MyLoadsDevices.jsx */}
      <div className="flex flex-wrap items-center justify-between pb-space-lg border-b border-surface-variant gap-space-sm mb-space-lg">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span>Account Management</span>
            <span>•</span>
            <span className="text-secondary font-title-sm">Operator Preferences</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-primary-container mt-0.5 tracking-tight">
            Profile &amp; Settings
          </h1>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg border border-surface-variant hover:bg-error-container hover:text-on-error-container text-on-surface text-label-md font-label-md flex items-center gap-2 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="mb-space-md p-space-md rounded-lg bg-secondary-container/60 text-on-secondary-fixed flex items-center gap-2 border border-secondary">
          <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
          <span className="font-title-sm text-title-sm">{successMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-space-md p-space-md rounded-lg bg-error-container text-on-error-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[20px]">error</span>
            <span className="font-body-sm text-body-sm">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-label-sm font-label-sm text-on-error-container hover:underline ml-2"
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: User Profile Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left 5 Cols: Account Summary Card */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-variant">
            <div className="flex items-center gap-space-md mb-space-md pb-space-md border-b border-surface-variant">
              <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-headline-sm font-bold shadow-sm">
                {(displayUser.name || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-title-lg text-title-lg text-primary-container truncate font-bold">
                  {displayUser.name}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {displayUser.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm uppercase bg-secondary-container text-on-secondary-fixed">
                    {displayUser.role || 'residential'}
                  </span>
                  {displayUser.role === 'admin' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm bg-primary-container text-on-primary">
                      Grid Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-space-sm">
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1 border-b border-surface-variant/60">
                <span className="text-on-surface-variant">Registered Email</span>
                <span className="font-medium text-on-surface">{displayUser.email}</span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1 border-b border-surface-variant/60">
                <span className="text-on-surface-variant">Account Type</span>
                <span className="font-medium text-on-surface capitalize">{displayUser.role || 'Residential Prosumer'}</span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1 border-b border-surface-variant/60">
                <span className="text-on-surface-variant">FlexCoin Balance</span>
                <Link to="/rewards-flexcoins" className="font-bold text-secondary flex items-center gap-1 hover:underline">
                  <span>{displayUser.flexCoins ?? 0} FC</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1">
                <span className="text-on-surface-variant">Grid Dispatch Status</span>
                <span className="inline-flex items-center gap-1 text-secondary font-medium">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Active Telemetry
                </span>
              </div>
            </div>
          </div>

          {/* Security / Honesty Note */}
          <div className="bg-surface-container p-space-md rounded-xl border border-surface-variant flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">verified_user</span>
            <div>
              <span className="font-label-md text-label-md text-on-surface font-semibold block">
                Enterprise TLS &amp; Token Auth
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Session credentials are authenticated via JWT tokens stored in your browser session. Role-based privileges are strictly enforced.
              </p>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Profile Update Form */}
        <div className="lg:col-span-7">
          <div className="bg-surface-container-lowest p-space-lg sm:p-space-xl rounded-xl shadow-sm border border-surface-variant">
            <div className="mb-space-md pb-space-sm border-b border-surface-variant">
              <h3 className="font-headline-sm text-headline-sm text-primary-container">
                Personal Information
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Update your operator display name. Per Section 15 contract, email and role are provisioned by your organization administrator.
              </p>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-space-md">
              <div className="space-y-1.5">
                <label className="block text-label-md font-label-md text-on-surface" htmlFor="operator-name">
                  Display Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    person
                  </span>
                  <input
                    id="operator-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-lowest text-on-surface text-body-md font-body-md rounded-lg border border-surface-variant outline-none transition-all shadow-sm focus:border-primary"
                    placeholder="Your Full Name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-label-md font-label-md text-on-surface" htmlFor="account-email">
                  Work Email (Read-only)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    alternate_email
                  </span>
                  <input
                    id="account-email"
                    type="email"
                    disabled
                    value={displayUser.email || ''}
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface-variant text-body-md font-body-md rounded-lg border border-surface-variant outline-none cursor-not-allowed opacity-80"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-label-md font-label-md text-on-surface" htmlFor="account-role">
                  System Role (Read-only)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    badge
                  </span>
                  <input
                    id="account-role"
                    type="text"
                    disabled
                    value={displayUser.role === 'admin' ? 'Grid Administrator' : displayUser.role || 'Residential Prosumer'}
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface-variant text-body-md font-body-md rounded-lg border border-surface-variant outline-none cursor-not-allowed opacity-80 capitalize"
                  />
                </div>
              </div>

              <div className="pt-space-sm flex items-center justify-between">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="px-6 py-2.5 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded-lg transition-all flex items-center gap-2 shadow-md disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setName(user?.name || '')}
                  className="text-label-md font-label-md text-on-surface-variant hover:text-on-surface px-3 py-1.5"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
