import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leagueService } from '../services/apiService';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search,
  Lock,
  LockOpen,
  SportsSoccer,
  SportsFootball,
  SportsBasketball,
  SportsHockey,
  SportsBaseball,
  Person,
  Visibility,
  VisibilityOff,
  Groups
} from '@mui/icons-material';

const LeagueJoin = () => {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinDialog, setJoinDialog] = useState({
    open: false,
    league: null,
    password: ''
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      // Using leagueService instead of apiService
      const response = await leagueService.getLeagues();
      setLeagues(response.data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
      showNotification('Failed to load leagues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleJoinOpen = (league) => {
    setJoinDialog({
      open: true,
      league,
      password: ''
    });
  };

  const handleJoinClose = () => {
    setJoinDialog({
      ...joinDialog,
      open: false
    });
  };

  const handlePasswordChange = (e) => {
    setJoinDialog({
      ...joinDialog,
      password: e.target.value
    });
  };

  const handleJoinLeague = async () => {
    try {
      // Using leagueService instead of apiService
      await leagueService.joinLeague(joinDialog.league.id, {
        password: joinDialog.league.isPrivate ? joinDialog.password : undefined
      });
      
      showNotification(`Successfully joined "${joinDialog.league.name}"!`, 'success');
      handleJoinClose();
      
      // Navigate to the league page after a short delay
      setTimeout(() => {
        navigate(`/leagues/${joinDialog.league.id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error joining league:', error);
      showNotification(error.response?.data?.message || 'Failed to join league', 'error');
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const filteredLeagues = leagues.filter(league => 
    league.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Groups sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Join a League
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search leagues"
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
          </Box>
        ) : filteredLeagues.length > 0 ? (
          <List>
            {filteredLeagues.map((league) => (
              <ListItem
                key={league.id}
                sx={{ 
                  bgcolor: 'background.paper', 
                  mb: 2, 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemIcon>
                  {league.isPrivate ? (
                    <Lock color="warning" />
                  ) : (
                    <LockOpen color="success" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="h6">
                      {league.name}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {league.description || 'No description available'}
                      </Typography>
                      <Box sx={{ display: 'flex', mt: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<Person />}
                          label={`${league.memberCount} members`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        {league.sports.map((sport) => (
                          <Chip
                            key={sport}
                            icon={getSportIcon(sport)}
                            label={sport}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                        <Chip
                          label={league.enableTiebreaker ? "Tiebreaker enabled" : "No tiebreaker"}
                          size="small"
                          color={league.enableTiebreaker ? "primary" : "default"}
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleJoinOpen(league)}
                  >
                    Join
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No leagues found matching your search
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={joinDialog.open} onClose={handleJoinClose}>
        <DialogTitle>Join League</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to join "{joinDialog.league?.name}"?
          </Typography>
          
          {joinDialog.league?.isPrivate && (
            <TextField
              autoFocus
              margin="dense"
              label="League Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              value={joinDialog.password}
              onChange={handlePasswordChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleJoinClose}>Cancel</Button>
          <Button 
            onClick={handleJoinLeague} 
            variant="contained" 
            color="primary"
            disabled={joinDialog.league?.isPrivate && !joinDialog.password}
          >
            Join
          </Button>
        </DialogActions>
      </Dialog>

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

export default LeagueJoin;