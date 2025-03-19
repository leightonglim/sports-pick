import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Grid
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import UpdateIcon from '@mui/icons-material/Update';
import SportsIcon from '@mui/icons-material/Sports';
import apiService from '../services/apiService';

const NotificationSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailWeeklyReminder: true,
    emailGameChanges: true,
    emailPickResults: true,
    emailLeagueUpdates: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const response = await apiService.getNotificationSettings();
        setNotificationSettings(response.data);
      } catch (error) {
        console.error('Error fetching notification settings:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load notification settings',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotificationSettings();
  }, []);

  const handleToggle = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await apiService.updateNotificationSettings(notificationSettings);
      setSnackbar({
        open: true,
        message: 'Notification settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save notification settings',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <NotificationsIcon sx={{ mr: 1 }} color="primary" />
        <Typography variant="h6">Notification Settings</Typography>
      </Box>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Manage your email notification preferences for pick reminders, game updates, and league activities.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditCalendarIcon sx={{ mr: 1 }} color="action" />
            <Typography variant="subtitle1">Pick Reminders & Results</Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.emailWeeklyReminder}
                onChange={() => handleToggle('emailWeeklyReminder')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">Weekly Pick Reminders</Typography>
                <Typography variant="body2" color="textSecondary">
                  Receive a reminder email when you haven't made picks for upcoming games
                </Typography>
              </Box>
            }
            sx={{ ml: 0, display: 'flex', alignItems: 'flex-start' }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.emailPickResults}
                onChange={() => handleToggle('emailPickResults')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">Pick Results</Typography>
                <Typography variant="body2" color="textSecondary">
                  Receive a summary of your picks' results after games are completed
                </Typography>
              </Box>
            }
            sx={{ ml: 0, display: 'flex', alignItems: 'flex-start' }}
          />
        </Grid>
        
        <Grid item xs={12} sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <UpdateIcon sx={{ mr: 1 }} color="action" />
            <Typography variant="subtitle1">Game Updates</Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.emailGameChanges}
                onChange={() => handleToggle('emailGameChanges')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">Game Changes</Typography>
                <Typography variant="body2" color="textSecondary">
                  Receive notifications when game details change for games you've already picked
                </Typography>
              </Box>
            }
            sx={{ ml: 0, display: 'flex', alignItems: 'flex-start' }}
          />
        </Grid>
        
        <Grid item xs={12} sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SportsIcon sx={{ mr: 1 }} color="action" />
            <Typography variant="subtitle1">League Activity</Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.emailLeagueUpdates}
                onChange={() => handleToggle('emailLeagueUpdates')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">League Updates</Typography>
                <Typography variant="body2" color="textSecondary">
                  Receive notifications about league changes, new members, and other league activities
                </Typography>
              </Box>
            }
            sx={{ ml: 0, display: 'flex', alignItems: 'flex-start' }}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveSettings}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default NotificationSettings;