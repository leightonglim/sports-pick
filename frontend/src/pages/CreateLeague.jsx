import React, { useState, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormLabel,
  FormControl,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Snackbar,
  Alert,
  FormHelperText,
  Chip
} from '@mui/material';

const SportsSoccer = lazy(() => import('@mui/icons-material/SportsSoccer'));
const SportsFootball = lazy(() => import('@mui/icons-material/SportsFootball'));
const SportsBasketball = lazy(() => import('@mui/icons-material/SportsBasketball'));
const SportsHockey = lazy(() => import('@mui/icons-material/SportsHockey'));
const SportsBaseball = lazy(() => import('@mui/icons-material/SportsBaseball'));

const SportChip = ({ sport, selected, onClick }) => (
  <Chip
    icon={getSportIcon(sport)}
    label={sport}
    onClick={onClick}
    color={selected ? 'primary' : 'default'}
    variant={selected ? 'filled' : 'outlined'}
    sx={{
      fontSize: '1rem',
      py: 3,
      px: 1,
      '& .MuiChip-icon': {
        mr: 0.5,
        fontSize: '1.5rem',
      },
    }}
  />
);

const CreateLeague = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: true,
    password: '',
    enableTiebreaker: true,
    sports: {
      NFL: false,
      NBA: false,
      MLB: false,
      NHL: false,
      Soccer: false
    }
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loading, setLoading] = useState(false);

  const steps = [
    'Enter League Details',
    'Select Sports',
    'Confirm and Create',
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 0) {
      if (!formData.name.trim()) {
        newErrors.name = 'League name is required.';
      }
      if (formData.isPrivate && !formData.password.trim()) {
        newErrors.password = 'Password is required for private leagues.';
      }
    } else if (step === 1) {
      const hasSports = Object.values(formData.sports).some(sport => sport);
      if (!hasSports) {
        newErrors.sports = 'Please select at least one sport.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSportChange = (sport) => {
    setFormData({
      ...formData,
      sports: {
        ...formData.sports,
        [sport]: !formData.sports[sport]
      }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const selectedSports = Object.entries(formData.sports)
        .filter(([_, selected]) => selected)
        .map(([sport]) => sport);

      const leagueData = {
        name: formData.name,
        description: formData.description,
        isPrivate: formData.isPrivate,
        password: formData.isPrivate ? formData.password : undefined,
        enableTiebreaker: formData.enableTiebreaker,
        sports: selectedSports,
      };

      const response = await apiService.post('/leagues', leagueData);

      setNotification({
        open: true,
        message: 'League created successfully!',
        severity: 'success',
      });

      setTimeout(() => {
        navigate(`/leagues/${response.data.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating league:', error);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to create league',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSportIcon = (sport) => {
    switch (sport) {
      case 'NFL': return <SportsFootball />;
      case 'NBA': return <SportsBasketball />;
      case 'MLB': return <SportsBaseball />;
      case 'NHL': return <SportsHockey />;
      case 'Soccer': return <SportsSoccer />;
      default: return null;
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="League Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                placeholder="Describe your league..."
              />
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isPrivate}
                      onChange={handleChange}
                      name="isPrivate"
                    />
                  }
                  label="Private League (requires password to join)"
                />
              </FormGroup>
            </Grid>
            {formData.isPrivate && (
              <Grid item xs={12}>
                <TextField
                  label="League Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.password}
                  helperText={errors.password}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enableTiebreaker}
                      onChange={handleChange}
                      name="enableTiebreaker"
                    />
                  }
                  label="Enable Tiebreaker (scoring takes betting lines into account)"
                />
              </FormGroup>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <>
            <FormControl component="fieldset" error={!!errors.sports}>
              <FormLabel component="legend">Select Sports for Your League</FormLabel>
              <FormHelperText>{errors.sports}</FormHelperText>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                {Object.keys(formData.sports).map((sport) => (
                  <SportChip
                    key={sport}
                    sport={sport}
                    selected={formData.sports[sport]}
                    onClick={() => handleSportChange(sport)}
                  />
                ))}
              </Box>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
              You can add or remove sports later as a league admin.
            </Typography>
          </>
        );
      case 2:
        const selectedSports = Object.entries(formData.sports)
          .filter(([_, selected]) => selected)
          .map(([sport]) => sport);
          
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              League Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="subtitle2">League Name:</Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="body1">{formData.name}</Typography>
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="subtitle2">Description:</Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="body1">
                  {formData.description || '(No description provided)'}
                </Typography>
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="subtitle2">Privacy:</Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="body1">
                  {formData.isPrivate ? 'Private (Password Protected)' : 'Public'}
                </Typography>
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="subtitle2">Tiebreaker:</Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="body1">
                  {formData.enableTiebreaker ? 'Enabled' : 'Disabled'}
                </Typography>
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="subtitle2">Sports:</Typography>
              </Grid>
              <Grid item xs={8}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedSports.map((sport) => (
                    <Chip
                      key={sport}
                      icon={getSportIcon(sport)}
                      label={sport}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isPrivate: true,
      password: '',
      enableTiebreaker: true,
      sports: {
        NFL: false,
        NBA: false,
        MLB: false,
        NHL: false,
        Soccer: false,
      },
    });
    setErrors({});
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <GroupAdd sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Create a New League
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ mb: 4 }} />

        {getStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          {activeStep !== 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
          )}
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              startIcon={<Check />}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create League'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
          <Button
            variant="outlined"
            color="secondary"
            onClick={resetForm}
            sx={{ ml: 2 }}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateLeague;