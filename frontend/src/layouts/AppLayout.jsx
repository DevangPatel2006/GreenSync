import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();

  // Dynamic adjustable sidebar state:
  // isCollapsed: true for compact icon rail (72px), false for expanded full sidebar
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('greensync_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // sidebarWidth: user adjustable width (200px to 400px), default 256px
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem('greensync_sidebar_width'), 10);
      return saved && saved >= 200 && saved <= 400 ? saved : 256;
    } catch {
      return 256;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDraggingRef = useRef(false);

  // Toggle collapse / expand
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('greensync_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleMenu = () => {
    if (window.innerWidth >= 1024) {
      toggleCollapse();
    } else {
      setMobileMenuOpen((prev) => !prev);
    }
  };

  // Resize drag handle handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientX = e.clientX;
      if (clientX < 140) {
        setIsCollapsed(true);
        try {
          localStorage.setItem('greensync_sidebar_collapsed', 'true');
        } catch (err) {}
      } else {
        const clampedWidth = Math.min(Math.max(clientX, 200), 400);
        setIsCollapsed(false);
        setSidebarWidth(clampedWidth);
        try {
          localStorage.setItem('greensync_sidebar_collapsed', 'false');
          localStorage.setItem('greensync_sidebar_width', String(clampedWidth));
        } catch (err) {}
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const handleResetWidth = () => {
    setSidebarWidth(256);
    setIsCollapsed(false);
    try {
      localStorage.setItem('greensync_sidebar_width', '256');
      localStorage.setItem('greensync_sidebar_collapsed', 'false');
    } catch (e) {}
  };

  // Main navigation items: Profile is distinct in the list
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
    { label: 'My Loads / Devices', path: '/my-loads-devices', icon: 'devices' },
    { label: 'Schedule & Recommendations', path: '/schedule-recommendations', icon: 'calendar_clock' },
    { label: 'Impact', path: '/impact', icon: 'energy_savings_leaf' },
    { label: 'Rewards & FlexCoins', path: '/rewards-flexcoins', icon: 'monetization_on' },
    ...(user?.role === 'admin' ? [{ label: 'Admin Grid', path: '/admin-grid', icon: 'tune' }] : []),
    {
      label: 'Profile',
      path: '/profile-settings?tab=profile',
      icon: 'person',
      isProfile: true,
    },
  ];

  // Settings item: pinned at bottom-left corner, linking to same page with tab=settings
  const settingsItem = {
    label: 'Settings',
    path: '/profile-settings?tab=settings',
    icon: 'settings',
  };

  const bottomNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
    { label: 'Loads', path: '/my-loads-devices', icon: 'devices' },
    { label: 'Schedule', path: '/schedule-recommendations', icon: 'calendar_clock' },
    { label: 'Impact', path: '/impact', icon: 'energy_savings_leaf' },
    { label: 'Profile', path: '/profile-settings?tab=profile', icon: 'person' },
  ];

  const isItemActive = (item) => {
    if (item.isProfile) {
      return (
        location.pathname === '/profile-settings' &&
        (!location.search || location.search.includes('tab=profile'))
      );
    }
    return location.pathname === item.path;
  };

  const isSettingsActive =
    location.pathname === '/profile-settings' &&
    location.search.includes('tab=settings');

  const currentDesktopWidth = isCollapsed ? 72 : sidebarWidth;

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* Top Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest border-b border-surface-variant">
        <div className="h-16 w-full px-gutter flex items-center justify-between">
          <div className="flex items-center gap-space-sm sm:gap-space-md">
            {/* Dynamic Adjustable Navbar Toggle Button */}
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              onClick={toggleMenu}
              aria-label="Toggle Navigation Menu"
              title={isCollapsed ? 'Expand navigation sidebar' : 'Collapse to compact rail'}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isCollapsed ? 'menu' : 'menu_open'}
              </span>
            </button>

            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-[#450C3F] flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L4 14H11L9 22L20 10H13L15 2H13Z" fill="#B9D175" />
                </svg>
              </div>
              <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#450C3F]">
                Green<span className="text-[#6B7280] font-semibold">Sync</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-space-md sm:gap-space-lg">
            <div className="flex items-center gap-space-sm">
              <button
                className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                type="button"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
              </button>
              <div className="h-6 w-[1px] bg-surface-variant"></div>
              <Link
                to="/profile-settings?tab=profile"
                className="flex items-center gap-2.5 pl-space-xs hover:opacity-90 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-label-md shadow-sm">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AU'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-title-sm text-body-md font-semibold text-on-surface leading-tight">
                    {user?.name || 'Alex Mercer'}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight capitalize">
                    {user?.role === 'admin' ? 'Grid Administrator' : user?.role || 'Enterprise Facility'}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Left Navigation Sidebar (Desktop: Dynamic & Adjustable) */}
      <aside
        style={{ width: `${currentDesktopWidth}px` }}
        className={`hidden lg:flex fixed left-0 top-16 bottom-0 bg-surface-container-lowest border-r border-surface-variant z-40 flex-col justify-between overflow-x-hidden ${
          isDragging ? '' : 'transition-[width] duration-200 ease-in-out'
        }`}
      >
        {/* Top Section: Navigation Section & Items */}
        <div className="p-space-sm flex flex-col overflow-y-auto flex-1">
          {!isCollapsed ? (
            <div className="px-space-sm py-space-xs mb-space-xs text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
              <span>Navigation</span>
              <span className="text-[10px] text-on-surface-variant/60 font-mono">
                {sidebarWidth}px
              </span>
            </div>
          ) : (
            <div className="py-space-xs mb-space-xs text-center text-label-sm text-on-surface-variant/60 font-mono text-[10px]">
              •••
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-2' : 'gap-space-sm px-space-sm'
                  } py-2.5 rounded-lg transition-colors group relative ${
                    active
                      ? 'bg-primary-container text-on-primary font-title-sm shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-body-md text-body-md'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px] shrink-0">
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {/* Floating tooltip for compact rail mode */}
                  {isCollapsed && (
                    <div className="hidden group-hover:block fixed left-[80px] px-2.5 py-1 bg-[#450C3F] text-[#B9D175] text-label-sm font-medium rounded-md shadow-xl z-50 whitespace-nowrap pointer-events-none">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Pinned Bottom Left Corner: Settings & Sidebar Collapse Toggle */}
        <div className="p-space-sm border-t border-surface-variant flex flex-col gap-1 bg-surface-container-lowest shrink-0">
          {/* Settings link at bottom-left corner linking to /profile-settings?tab=settings */}
          <Link
            to={settingsItem.path}
            title={isCollapsed ? settingsItem.label : undefined}
            className={`flex items-center ${
              isCollapsed ? 'justify-center px-2' : 'gap-space-sm px-space-sm'
            } py-2.5 rounded-lg transition-colors group relative ${
              isSettingsActive
                ? 'bg-primary-container text-on-primary font-title-sm shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-body-md text-body-md'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] shrink-0">
              {settingsItem.icon}
            </span>
            {!isCollapsed && (
              <span className="truncate">{settingsItem.label}</span>
            )}
            {/* Tooltip in collapsed mode */}
            {isCollapsed && (
              <div className="hidden group-hover:block fixed left-[80px] px-2.5 py-1 bg-[#450C3F] text-[#B9D175] text-label-sm font-medium rounded-md shadow-xl z-50 whitespace-nowrap pointer-events-none">
                {settingsItem.label}
              </div>
            )}
          </Link>

          {/* Quick Collapse / Expand control */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand sidebar width' : 'Collapse to compact rail'}
            className={`flex items-center ${
              isCollapsed ? 'justify-center px-2' : 'justify-between px-space-sm'
            } py-1.5 rounded-lg text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition-colors text-label-sm cursor-pointer`}
          >
            {!isCollapsed && (
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                Compact Rail
              </span>
            )}
            <span className="material-symbols-outlined text-[18px] shrink-0">
              {isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
            </span>
          </button>
        </div>

        {/* Draggable resize border handle on the right edge */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleResetWidth}
          title="Drag to adjust navbar width • Double-click to reset (256px)"
          className="absolute top-0 right-0 bottom-0 w-1.5 hover:w-2 bg-transparent hover:bg-primary/20 active:bg-primary/40 cursor-col-resize transition-all z-50 group flex items-center justify-center"
        >
          <div className="w-[2px] h-10 rounded-full bg-surface-variant group-hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </aside>

      {/* Mobile Drawer (Visible on < 1024px when hamburger toggled) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 max-w-[80vw] h-full bg-surface-container-lowest border-r border-surface-variant pt-20 p-space-md flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="px-space-sm py-space-xs mb-space-sm text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
                Navigation
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = isItemActive(item);
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors ${
                        active
                          ? 'bg-primary-container text-on-primary font-title-sm'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-body-md text-body-md'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom-left pinned settings & capacity in mobile drawer */}
            <div className="p-space-sm border-t border-surface-variant flex flex-col gap-2">
              <Link
                to={settingsItem.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors ${
                  isSettingsActive
                    ? 'bg-primary-container text-on-primary font-title-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-body-md text-body-md'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{settingsItem.icon}</span>
                <span>{settingsItem.label}</span>
              </Link>
              <div className="flex items-center justify-between pt-2 border-t border-surface-variant/60">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Active Flex Capacity</span>
                  <span className="font-title-sm text-title-sm text-primary-container">142.8 kW</span>
                </div>
                <span className="material-symbols-outlined text-secondary text-[22px]">bolt</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: dynamically adjusted padding matching navbar width */}
      <div
        style={{
          '--desktop-pad': `${currentDesktopWidth}px`,
        }}
        className={`w-full pl-0 lg:pl-[var(--desktop-pad)] pb-16 sm:pb-0 ${
          isDragging ? '' : 'transition-[padding] duration-200 ease-in-out'
        }`}
      >
        <main className="w-full min-h-[calc(100vh-4rem)] pt-24 px-space-md sm:px-gutter pb-space-xl bg-surface">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation Bar for Mobile (< 640px) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-surface-variant flex items-center justify-around py-1.5 px-2">
        {bottomNavItems.map((item) => {
          const active = isItemActive(item);
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-colors ${
                active ? 'text-primary-container font-semibold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
