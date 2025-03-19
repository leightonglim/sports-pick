import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar
} from '@mui/material';
import { AccountCircle, Edit, Save, Cancel } from '@mui/icons-material';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    timezone: '',
    emailNotifications: true
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [userLeagues, setUserLeagues] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        timezone: user.timezone || 'America/New_York',
        emailNotifications: user.emailNotifications !== false
      });
      
      // Fetch leagues the user is a member of
      fetchUserLeagues();
    }
  }, [user]);

  const fetchUserLeagues = async () => {
    try {
      const response = await apiService.get('/leagues/user');
      setUserLeagues(response.data);
    } catch (error) {
      console.error('Error fetching user leagues:', error);
      showNotification('Failed to load your leagues', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.put('/users/profile', formData);
      await refreshUser();
      setEditMode(false);
      showNotification('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Failed to update profile', 'error');
    }
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleLeaveLeague = async (leagueId) => {
    if (window.confirm('Are you sure you want to leave this league?')) {
      try {
        await apiService.delete(`/leagues/${leagueId}/leave`);
        fetchUserLeagues();
        showNotification('Successfully left the league', 'success');
      } catch (error) {
        console.error('Error leaving league:', error);
        showNotification('Failed to leave league', 'error');
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
            <AccountCircle fontSize="large" />
          </Avatar>
          <Typography variant="h4" component="h1">
            {user?.username || 'User Profile'}
          </Typography>
          {!editMode && (
            <Button
              startIcon={<Edit />}
              sx={{ ml: 'auto' }}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </Button>
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                fullWidth
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                fullWidth
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                fullWidth
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Timezone"
                name="timezone"
                select
                value={formData.timezone}
                onChange={handleChange}
                fullWidth
                disabled={!editMode}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Email Notifications:
                </Typography>
                <Chip
                  label={formData.emailNotifications ? "Enabled" : "Disabled"}
                  color={formData.emailNotifications ? "success" : "default"}
                  variant="outlined"
                  onClick={() => editMode && setFormData({
                    ...formData,
                    emailNotifications: !formData.emailNotifications
                  })}
                  disabled={!editMode}
                />
              </Box>
            </Grid>

            {editMode && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Cancel />}
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </form>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          My Leagues
        </Typography>
        
        {userLeagues.length > 0 ? (
          <List>
            {userLeagues.map((league) => (
              <ListItem
                key={league.id}
                secondaryAction={
                  <Button
                    color="error"
                    size="small"
                    onClick={() => handleLeaveLeague(league.id)}
                  >
                    Leave
                  </Button>
                }
                sx={{ 
                  bgcolor: 'background.paper', 
                  mb: 1, 
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' } 
                }}
              >
                <ListItemText
                  primary={league.name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {league.isAdmin ? 'Admin' : 'Member'}
                      </Typography>
                      {` - Sports: ${league.sports.join(', ')}`}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1" color="text.secondary">
            You are not a member of any leagues yet.
          </Typography>
        )}
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

export default Profile;