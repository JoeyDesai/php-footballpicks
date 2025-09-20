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
      // Check session status using the existing API
      const response = await authAPI.checkSession();
      if (response.data && (response.data.authenticated || response.data.success)) {
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
        // Login successful, set basic user object
        setUser({ 
          id: 1, 
          email: email,
          nickname: email, // Use email as nickname for now
          realName: email 
        });
        return { success: true };
      } else {
        return { success: false, error: response.data?.error || 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        return { success: false, error: error.response.data.error };
      }
      return { success: false, error: 'Network error - unable to connect to server' };
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
      // The PHP system will show success message or errors
      if (response.status === 200) {
        return { success: true };
      } else {
        return { success: false, error: 'Account creation failed' };
      }
    } catch (error) {
      console.error('Create account error:', error);
      return { success: false, error: 'Network error - make sure the PHP backend is running' };
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