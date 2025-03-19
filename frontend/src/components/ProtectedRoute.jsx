// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;