import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const resetToken = queryParams.get('token');
    if (!resetToken) {
      setStatus({ 
        type: 'error', 
        message: 'Invalid or missing reset token. Please request a new password reset link.'
      });
    } else {
      setToken(resetToken);
    }
  }, [location]);

  const validateForm = () => {
    if (password.length < 8) {
      setStatus({ 
        type: 'error', 
        message: 'Password must be at least 8 characters long'
      });
      return false;
    }
    
    if (password !== confirmPassword) {
      setStatus({ 
        type: 'error', 
        message: 'Passwords do not match'
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      await api.post('/auth/reset-password', { 
        token, 
        newPassword: password 
      });
      
      setStatus({ 
        type: 'success', 
        message: 'Password has been reset successfully!'
      });
      
      // Navigate to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'An error occurred while resetting your password. Please try again.'
      });
      console.error('Error resetting password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Reset Password
        </Typography>
        <Typography variant="body1" align="center" paragraph>
          Create a new password for your account.
        </Typography>

        {status.message && (
          <Alert severity={status.type} sx={{ mb: 3 }}>
            {status.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="New Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting || !token}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting || !token}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting || !token}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary">
              Back to Login
            </Typography>
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword;
