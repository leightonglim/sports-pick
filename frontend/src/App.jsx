import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AuthProvider } from './context/AuthContext.jsx';

// Layouts
import Layout from './components/Layout';

// Public Pages
import Login from './pages/Login.jsx';
import Registration from './pages/Registration.jsx';
import EmailVerification from './pages/EmailVerification.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import LandingPage from './pages/LandingPage.jsx';

// Protected Pages
import Home from './pages/Home.jsx';
import Picks from './pages/Picks.jsx';
import Standings from './pages/Standings.jsx';
import Profile from './pages/Profile.jsx';
import CreateLeague from './pages/CreateLeague.jsx';
import LeagueJoin from './pages/LeagueJoin.jsx';
import PastPicks from './pages/PastPicks.jsx';
import WeeklyGames from './pages/WeeklyGames.jsx';
import NotificationSettings from './pages/NotificationSettings.jsx';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute.jsx';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/verify-email/:token" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/picks" element={<Picks />} />
              <Route path="/picks/:leagueId/:sport/:week" element={<Picks />} />
              <Route path="/past-picks" element={<PastPicks />} />
              <Route path="/leagues/:leagueId/leaderboard" element={<Standings />} />
              <Route path="/leagues/:leagueId/manage" element={<Standings />} />
              <Route path="/leagues/create" element={<CreateLeague />} />
              <Route path="/leagues/join" element={<LeagueJoin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/games/:sport/:week" element={<WeeklyGames />} />
              <Route path="/notifications" element={<NotificationSettings />} />
            </Route>
            
            {/* Redirect /home to /dashboard */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch-all redirect to dashboard when logged in, otherwise to landing page */}
            <Route path="*" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
