import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser, clearAuthStorage } from '../services/api';
import { ROLES, canAccessTab } from '../types/roles';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Verify and re-hydrate authentication state on startup
  useEffect(() => {
    async function verifyAuth() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          setStoredUser(res.user);
        } else {
          // Token invalid or expired
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        // If 401, clear credentials
        if (err.status === 401) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.login(credentials);
      setUser(res.user);
      setToken(res.token);
      setIsLoading(false);
      return res.user;
    } catch (err) {
      setIsLoading(false);
      const msg = err.data?.error || err.message || 'Login failed. Please check your credentials.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const register = async (registrationData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.register(registrationData);
      setUser(res.user);
      setToken(res.token);
      setIsLoading(false);
      return res.user;
    } catch (err) {
      setIsLoading(false);
      const msg = err.data?.error || err.message || 'Registration failed.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      clearAuthStorage();
      setUser(null);
      setToken(null);
      setAuthError(null);
    }
  }, []);

  const clearError = () => {
    setAuthError(null);
  };

  const isRole = (role) => {
    return user?.role?.toUpperCase() === role.toUpperCase();
  };

  const hasAccessToTab = (tab) => {
    if (!user) return false;
    return canAccessTab(user.role, tab);
  };

  const getDefaultTabForRole = () => {
    if (!user) return 'login';
    const role = user.role.toUpperCase();
    if (role === ROLES.ADMIN) return 'admin';
    if (role === ROLES.RESPONDER) return 'responder';
    return 'citizen';
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    authError,
    login,
    register,
    logout,
    clearError,
    isRole,
    hasAccessToTab,
    getDefaultTabForRole,
    ROLES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
