import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (session-based)
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Since the original app uses PHP sessions, we'll make a request to check session status
      const response = await authAPI.checkSession();
      if (response.data.authenticated) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('No active session');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const createAccount = async (userData) => {
    try {
      const response = await authAPI.createAccount(userData);
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.error || 'Account creation failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const value = {
    user,
    login,
    logout,
    createAccount,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}