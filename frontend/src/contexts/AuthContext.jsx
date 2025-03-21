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

// Example updated AuthContext.js login method
// Your file may be different, so adapt as needed
const login = async (username, password, rememberMe = false) => {
  try {
    const response = await userService.login(username, password);
    
    const token = response.data.token; // Adjust based on your API response structure
    
    // Store token using the appropriate method
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
    
    // Set auth state
    setUser(response.data.user); // Adjust based on your API response structure
    setIsAuthenticated(true);
    
    return response.data;
  } catch (error) {
    throw error;
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