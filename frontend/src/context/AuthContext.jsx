import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { ERROR_MESSAGES, getFriendlyErrorMessage } from '../utils/errorMapper';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Restore session on boot
  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // Attempt GET /api/auth/me per Section 15
        const res = await api.get('/auth/me');
        const userData = res?.user || res?.data?.user || res?.data || res;
        setUser(userData);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const receivedToken = res?.token || res?.data?.token;
      const userData = res?.user || res?.data?.user;

      if (!receivedToken || !userData) {
        throw new Error('Malformed login response from server.');
      }

      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const friendlyMsg = err.response?.status === 401
        ? ERROR_MESSAGES.INVALID_LOGIN
        : getFriendlyErrorMessage(err);
      throw new Error(friendlyMsg);
    }
  };

  const register = async (name, email, password, role = 'residential') => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const receivedToken = res?.token || res?.data?.token;
      const userData = res?.user || res?.data?.user;

      if (!receivedToken || !userData) {
        throw new Error('Malformed registration response from server.');
      }

      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('cached_user');
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const res = await api.put('/users/profile', updates);
      const updatedUser = res?.user || res?.data?.user || { ...user, ...updates };
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
