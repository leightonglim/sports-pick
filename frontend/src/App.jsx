import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { theme, darkTheme } from './theme';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';

// Layouts
import Layout from './components/Layout';

// Public Pages - These pages are small and frequently accessed, so keep them eagerly loaded
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Registration from './pages/Registration.jsx';

// Lazy-loaded pages for better performance
const EmailVerification = lazy(() => import('./pages/EmailVerification.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));

// Protected Pages - Lazy loaded
const Home = lazy(() => import('./pages/Home.jsx'));
const Picks = lazy(() => import('./pages/Picks.jsx'));
const Standings = lazy(() => import('./pages/Standings.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const CreateLeague = lazy(() => import('./pages/CreateLeague.jsx'));
const LeagueJoin = lazy(() => import('./pages/LeagueJoin.jsx'));
const PastPicks = lazy(() => import('./pages/PastPicks.jsx'));
const WeeklyGames = lazy(() => import('./pages/WeeklyGames.jsx'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings.jsx'));

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute.jsx';

/**
 * Main application component
 * 
 * Provides theme and authentication context to the entire application.
 * Handles routing and lazy loading of components for better performance.
 * Implements error boundaries for graceful error handling.
 */
const App = () => {
  // State for theme toggle (can be connected to user preferences or system preference)
  const [useDarkTheme, setUseDarkTheme] = useState(false);
  const activeTheme = useDarkTheme ? darkTheme : theme;

  // Function to toggle theme mode
  const toggleTheme = () => {
    setUseDarkTheme(!useDarkTheme);
  };

  return (
     <ErrorBoundary>
      <ThemeProvider theme={activeTheme}>
        <CssBaseline />
        <AuthProvider themeMode={{ useDarkTheme, toggleTheme }}>
          <Router>
            {/* <Suspense fallback={<LoadingScreen />}> */}
              <Routes>
                {/* 
                  Public Routes
                  These routes are accessible without authentication
                */}
                <Route path="/" element={<LandingPage />} />
                {/* <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Registration />} />
                <Route path="/verify-email/:token" element={<EmailVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                 */}
                {/* 
                  Protected Routes with Layout
                  All routes below require authentication and use the standard Layout
                */}
                {/* <Route element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }> */}
                  {/* Dashboard Routes */}
                  {/* <Route path="/dashboard" element={<Home />} /> */}
                  
                  {/* Picks Routes */}
                  {/* <Route path="/picks" element={<Picks />} />
                  <Route path="/picks/:leagueId/:sport/:week" element={<Picks />} />
                  <Route path="/past-picks" element={<PastPicks />} />
                  <Route path="/games/:sport/:week" element={<WeeklyGames />} />
                   */}
                  {/* League Routes */}
                  {/* <Route path="/leagues/:leagueId/leaderboard" element={<Standings />} />
                  <Route path="/leagues/:leagueId/manage" element={<Standings />} />
                  <Route path="/leagues/create" element={<CreateLeague />} />
                  <Route path="/leagues/join" element={<LeagueJoin />} />
                   */}
                  {/* User Settings Routes */}
                  {/* <Route path="/profile" element={<Profile />} />
                  <Route path="/notifications" element={<NotificationSettings />} />
                </Route> */}
                
                {/* Redirect /home to /dashboard */}
                {/* <Route path="/home" element={<Navigate to="/dashboard" replace />} /> */}
                
                {/* Catch-all redirect to dashboard when logged in, otherwise to landing page */}
                {/* <Route path="*" element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                } /> */}
              </Routes>
            {/* </Suspense> */}
          </Router>
        </AuthProvider>
      </ThemeProvider>
      </ErrorBoundary>
  );
};

export default App;