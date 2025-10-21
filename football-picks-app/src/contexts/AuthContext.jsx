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
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.checkSession();
      if (response.data && response.data.authenticated) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('No active session:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data && response.data.success) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.data?.error || 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        return { success: false, error: error.response.data.error };
      }
      return { success: false, error: 'Network error - make sure the backend server is running on port 3001' };
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
      if (response.data && response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data?.error || 'Account creation failed' };
      }
    } catch (error) {
      console.error('Create account error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        return { success: false, error: error.response.data.error };
      }
      return { success: false, error: 'Network error - make sure the backend server is running on port 3001' };
    }
  };

  // Check if user is admin
  const isAdmin = user && (user.email === 'jase@jasetheace.com' || user.email === 'joe');

  const value = {
    user,
    login,
    logout,
    createAccount,
    loading,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}