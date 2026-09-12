import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function ProtectedRoute({ requireAdmin = false, publicOnly = false, children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-gutter">
        <div className="flex flex-col items-center gap-space-md animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-surface-container-high"></div>
          <div className="h-4 w-32 bg-surface-container-high rounded"></div>
        </div>
      </div>
    );
  }

  // Public-only pages (e.g. /sign-in, /sign-up) redirect to /dashboard if logged in
  if (publicOnly && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Protected pages redirect to /sign-in if not logged in
  if (!publicOnly && !isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  // Admin-only route guard
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}
