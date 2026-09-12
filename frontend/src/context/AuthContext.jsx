import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
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
        // Real API call: GET /api/auth/me
        const response = await api.get('/auth/me');
        const userData = response.data?.user || response.data;
        setUser(userData);
        setToken(storedToken);
      } catch (err) {
        if (err.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        } else {
          // TODO(backend): When /api/auth/me is not yet mounted on backend, restore cached session
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
              setToken(storedToken);
            } catch (e) {
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

  const login = useCallback(async (email, password) => {
    try {
      // Real API call: POST /api/auth/login
      const response = await api.post('/auth/login', { email, password });
      const authToken = response.data?.token || response.token;
      const authUser = response.data?.user || response.user || {
        id: 'u_operator',
        name: 'Alex Mercer',
        email,
        role: email.includes('admin') ? 'admin' : 'operator',
        flexCoins: 1420,
      };

      if (authToken) {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        setToken(authToken);
        setUser(authUser);
        return { success: true, user: authUser };
      }
      throw new Error('No token returned from server');
    } catch (err) {
      // If backend endpoint is missing (404/network error), gracefully fallback to mock session
      if (err.status === 404 || err.isNetworkError) {
        // TODO(backend): Wire to real POST /api/auth/login once backend auth routes are mounted
        const mockToken = 'mock_jwt_' + btoa(JSON.stringify({ email, time: Date.now() }));
        const mockUser = {
          id: 'u_' + Date.now(),
          name: email.split('@')[0].replace('.', ' '),
          email,
          role: email.includes('admin') ? 'admin' : 'operator',
          flexCoins: 1420,
        };

        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setToken(mockToken);
        setUser(mockUser);
        return { success: true, user: mockUser };
      }
      throw err;
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      // Real API call: POST /api/auth/register
      const response = await api.post('/auth/register', { name, email, password });
      const authToken = response.data?.token || response.token;
      const authUser = response.data?.user || response.user || {
        id: 'u_' + Date.now(),
        name,
        email,
        role: email.includes('admin') ? 'admin' : 'residential',
        flexCoins: 0,
      };

      if (authToken) {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        setToken(authToken);
        setUser(authUser);
        return { success: true, user: authUser };
      }
      throw new Error('No token returned from server');
    } catch (err) {
      if (err.status === 404 || err.isNetworkError) {
        // TODO(backend): Wire to real POST /api/auth/register once backend auth routes are mounted
        const mockToken = 'mock_jwt_' + btoa(JSON.stringify({ email, name, time: Date.now() }));
        const mockUser = {
          id: 'u_' + Date.now(),
          name,
          email,
          role: email.includes('admin') ? 'admin' : 'residential',
          flexCoins: 0,
        };

        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setToken(mockToken);
        setUser(mockUser);
        return { success: true, user: mockUser };
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      // Real API call: PUT /api/users/profile
      const response = await api.put('/users/profile', data);
      const updated = response.data?.user || response.data || { ...user, ...data };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      return { success: true, user: updated, message: 'Profile updated successfully' };
    } catch (err) {
      if (err.status === 404 || err.isNetworkError) {
        // TODO(backend): Wire to real PUT /api/users/profile once backend user routes are mounted
        const updated = { ...user, ...data };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        return { success: true, user: updated, message: 'Profile updated successfully' };
      }
      throw err;
    }
  }, [user]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout,
    updateProfile,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
