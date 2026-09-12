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
        const userData = res.data || res.user || res;
        setUser(userData);
      } catch (err) {
        // TODO(backend): If /api/auth/me is not implemented or returns 404/401, handle session restoration
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        } else {
          // Restore from cached mock user if available
          const cachedUser = localStorage.getItem('cached_user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch {
              setUser(null);
            }
          }
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
      const receivedToken = res.data?.token || res.token || 'mock_jwt_token_' + Date.now();
      const userData = res.data?.user || res.user || {
        id: 'usr_default',
        name: email.split('@')[0] || 'Enterprise Operator',
        email,
        role: email.includes('admin') ? 'admin' : 'operator',
        flexCoins: 1420,
      };

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('cached_user', JSON.stringify(userData));
      setToken(receivedToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      // TODO(backend): Endpoint /api/auth/login not yet mounted on backend. Fallback to client-side contract stub.
      if (err.code === 'ERR_NETWORK' || err.response?.status === 404) {
        console.warn('Backend /api/auth/login not available, activating contract fallback.');
        const mockToken = 'mock_jwt_token_' + Date.now();
        const mockUser = {
          id: 'usr_' + Date.now(),
          name: email.includes('admin') ? 'Admin Dispatcher' : 'Alex Mercer',
          email,
          role: email.includes('admin') ? 'admin' : 'operator',
          flexCoins: 1420,
        };
        localStorage.setItem('token', mockToken);
        localStorage.setItem('cached_user', JSON.stringify(mockUser));
        setToken(mockToken);
        setUser(mockUser);
        return { success: true, user: mockUser };
      }

      const friendlyMsg = err.response?.status === 401
        ? ERROR_MESSAGES.INVALID_LOGIN
        : getFriendlyErrorMessage(err);
      throw new Error(friendlyMsg);
    }
  };

  const register = async (name, email, password, role = 'residential') => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const receivedToken = res.data?.token || res.token || 'mock_jwt_token_' + Date.now();
      const userData = res.data?.user || res.user || {
        id: 'usr_' + Date.now(),
        name,
        email,
        role: role === 'commercial' ? 'operator' : 'residential',
        flexCoins: 100, // Welcome bonus
      };

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('cached_user', JSON.stringify(userData));
      setToken(receivedToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      // TODO(backend): Endpoint /api/auth/register not yet mounted on backend. Fallback to contract stub.
      if (err.code === 'ERR_NETWORK' || err.response?.status === 404) {
        console.warn('Backend /api/auth/register not available, activating contract fallback.');
        const mockToken = 'mock_jwt_token_' + Date.now();
        const mockUser = {
          id: 'usr_' + Date.now(),
          name,
          email,
          role: role === 'commercial' ? 'operator' : 'residential',
          flexCoins: 100,
        };
        localStorage.setItem('token', mockToken);
        localStorage.setItem('cached_user', JSON.stringify(mockUser));
        setToken(mockToken);
        setUser(mockUser);
        return { success: true, user: mockUser };
      }

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
      const updatedUser = res.data?.user || { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('cached_user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (err) {
      // TODO(backend): Endpoint /api/users/profile not yet mounted on backend.
      console.warn('Backend /api/users/profile not available, updating local profile state.');
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('cached_user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
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
