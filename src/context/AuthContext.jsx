import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session on mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const user = await authService.getMe();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const user = await authService.login(email, password);
    setCurrentUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setCurrentUser(null);
    }
  };

  const hasPermission = useCallback((permissionSlug) => {
    if (!currentUser) return false;
    if (currentUser.role?.slug === 'admin') return true;
    return Array.isArray(currentUser.permissions) && currentUser.permissions.includes(permissionSlug);
  }, [currentUser]);

  const value = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    role: currentUser?.role || null,
    permissions: currentUser?.permissions || [],
    loading,
    login,
    logout,
    checkAuth,
    hasPermission,
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
