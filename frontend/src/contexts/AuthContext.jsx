// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { userService } from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, themeMode = { useDarkTheme: false, setUseDarkTheme: () => {} } }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // The token will be added by the request interceptor
          const response = await userService.getProfile();
          setCurrentUser(response.data);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Load user theme preference from localStorage if available
  useEffect(() => {
    if (themeMode && localStorage.getItem('theme') === 'dark') {
      themeMode.setUseDarkTheme(true);
    }
  }, [themeMode]);

  // Save theme preference when it changes
  useEffect(() => {
    if (themeMode) {
      localStorage.setItem('theme', themeMode.useDarkTheme ? 'dark' : 'light');
    }
  }, [themeMode?.useDarkTheme]);

  const login = async (username, password, rememberMe = false) => {
    try {
      setError(null);
      
      // Log what's being sent for debugging
      console.log('Attempting login with:', { username, passwordLength: password.length });
      
      const response = await userService.login(username, password);
      
      // Log successful response for debugging
      console.log('Login response:', response);
      
      // Extract token and user from response
      const { token, user } = response.data;
      
      // Store token in localStorage (or sessionStorage for non-persistent sessions)
      if (rememberMe) {
        localStorage.setItem('token', token);
      } else {
        // Still store in localStorage, but you could use sessionStorage if you implement that logic
        localStorage.setItem('token', token);
      }
      
      // Update user state
      setCurrentUser(user);
      
      return response.data;
    } catch (err) {
      console.error('Login error details:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await userService.register(userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('theme'); // Optional, if resetting theme on logout
    setCurrentUser(null);
  };  

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await userService.updateProfile(userData);
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    themeMode, // Add themeMode to the context value
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;