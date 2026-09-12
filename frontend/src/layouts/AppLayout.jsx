import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function AppLayout() {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
    { label: 'My Loads / Devices', path: '/my-loads-devices', icon: 'devices' },
    { label: 'Add Flexible Load', path: '/my-loads-devices?add=1', icon: 'add_circle' },
    { label: 'Schedule & Recommendations', path: '/schedule-recommendations', icon: 'calendar_clock' },
    { label: 'Impact', path: '/impact', icon: 'energy_savings_leaf' },
    { label: 'Rewards & FlexCoins', path: '/rewards-flexcoins', icon: 'monetization_on' },
    { label: 'Admin Grid', path: '/admin-grid', icon: 'tune' },
    { label: 'Profile & Settings', path: '/profile-settings', icon: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* Top Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest border-b border-surface-variant">
        <div className="h-16 w-full px-gutter flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <svg className="h-8 w-auto object-contain" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" fill="none">
              <rect width="32" height="32" x="4" y="4" rx="8" fill="#450C3F" />
              <path d="M20 9L13 21H19L17 31L27 19H21L23 9H20Z" fill="#B9D175" />
              <text x="44" y="26" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="20" fontWeight="700" fill="#450C3F" letterSpacing="-0.5px">
                Green<tspan fill="#6B7280" fontWeight="500">Sync</tspan>
              </text>
            </svg>
            <span className="font-headline-sm text-headline-sm text-primary-container tracking-tight">GreenSync</span>
          </div>

          <div className="flex items-center gap-space-lg">
            <div className="hidden sm:flex items-center gap-space-xs px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed border border-secondary-fixed-dim">
              <span className="w-2 h-2 rounded-full bg-secondary inline-block animate-pulse"></span>
              <span className="font-label-md text-label-md">Grid Status: Balanced • 68% Renewable</span>
            </div>

            <div className="flex items-center gap-space-sm">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                type="button"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </button>
              <div className="h-5 w-[1px] bg-surface-variant"></div>
              <div className="flex items-center gap-space-sm pl-space-xs">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-label-md text-label-md text-on-surface leading-tight">Alex Mercer</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">Enterprise Facility</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Left Navigation Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest border-r border-surface-variant z-40 flex flex-col justify-between overflow-y-auto">
        <div className="p-space-md">
          <div className="px-space-sm py-space-xs mb-space-sm text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
            Navigation
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-container text-on-primary font-title-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-body-md text-body-md'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-space-md border-t border-surface-variant bg-surface-container-low">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Active Flex Capacity</span>
              <span className="font-title-sm text-title-sm text-primary-container">142.8 kW</span>
            </div>
            <span className="material-symbols-outlined text-secondary text-[22px]">bolt</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64">
        <main className="w-full min-h-[calc(100vh-4rem)] pt-16 px-gutter py-space-lg bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
