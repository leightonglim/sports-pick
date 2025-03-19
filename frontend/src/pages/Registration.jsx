import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Alert
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import apiService from '../services/apiService';

const Registration = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    displayName: ''
  });
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    displayName: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for the field being edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    const errors = { ...formErrors };

    if (step === 0) {
      // Validate email and username
      if (!formData.email) {
        errors.email = 'Email is required';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Email is invalid';
        isValid = false;
      }

      if (!formData.username) {
        errors.username = 'Username is required';
        isValid = false;
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
        isValid = false;
      }
    } else if (step === 1) {
      // Validate passwords
      if (!formData.password) {
        errors.password = 'Password is required';
        isValid = false;
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
        isValid = false;
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    } else if (step === 2) {
      // Validate name fields
      if (!formData.firstName) {
        errors.firstName = 'First name is required';
        isValid = false;
      }
      
      if (!formData.lastName) {
        errors.lastName = 'Last name is required';
        isValid = false;
      }
      
      if (!formData.displayName) {
        errors.displayName = 'Display name is required';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(activeStep)) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { confirmPassword, ...registrationData } = formData;
      await apiService.register(registrationData);
      setActiveStep(3); // Move to success step
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  error={!!formErrors.username}
                  helperText={formErrors.username}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </>
        );
      case 1:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Security
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </>
        );
      case 2:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Personal Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Display Name (visible to other users)"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  error={!!formErrors.displayName}
                  helperText={formErrors.displayName || "This is how other users will see you"}
                />
              </Grid>
            </Grid>
          </>
        );
      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Registration Successful!
            </Typography>
            <Typography variant="body1" paragraph>
              We've sent a verification email to {formData.email}.
            </Typography>
            <Typography variant="body1" paragraph>
              Please check your inbox and click the verification link to activate your account.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: { xs: 2, md: 6 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonAddIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
          <Typography component="h1" variant="h5">
            Create Your Account
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Account</StepLabel>
          </Step>
          <Step>
            <StepLabel>Security</StepLabel>
          </Step>
          <Step>
            <StepLabel>Profile</StepLabel>
          </Step>
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={activeStep === 2 ? handleSubmit : handleNext}>
          {getStepContent(activeStep)}
          
          {activeStep < 3 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0 || isLoading}
                onClick={handleBack}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                type={activeStep === 2 ? 'submit' : 'button'}
                onClick={activeStep === 2 ? undefined : handleNext}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {activeStep === 2 ? 'Sign Up' : 'Next'}
              </Button>
            </Box>
          )}
        </form>
        
        {activeStep < 3 && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Sign in
              </Link>
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Registration;