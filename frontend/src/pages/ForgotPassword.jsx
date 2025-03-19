import React, { useState } from 'react';
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
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      await api.post('/auth/forgot-password', { email });
      setStatus({ 
        type: 'success', 
        message: 'If that email exists in our system, you will receive a password reset link shortly.'
      });
      setEmail('');
    } catch (error) {
      // We don't want to reveal if an email exists in our system
      setStatus({ 
        type: 'success', 
        message: 'If that email exists in our system, you will receive a password reset link shortly.'
      });
      console.error('Error requesting password reset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body1" align="center" paragraph>
          Enter your email address and we'll send you a link to reset your password.
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
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Send Reset Link'}
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

export default ForgotPassword;