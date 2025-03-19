import React, { useState, useEffect, useContext } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  TextField, 
  Switch, 
  FormControlLabel, 
  CircularProgress, 
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
  Chip, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  IconButton, 
  Divider, 
  Snackbar, 
  Alert, 
  Tooltip 
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Person as PersonIcon, Sports as SportsIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

const LeagueManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState([]);
  const [allSports, setAllSports] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [sportsDialogOpen, setSportsDialogOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leagueMembers, setLeagueMembers] = useState([]);
  const [leagueSports, setLeagueSports] = useState([]);
  const [availableSports, setAvailableSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [newLeague, setNewLeague] = useState({
    name: '',
    description: '',
    tiebreaker: false,
    isPrivate: true,
    sports: []
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await api.get('/leagues/user');
        setLeagues(response.data);
        
        const sportsResponse = await api.get('/sports');
        setAllSports(sportsResponse.data);
      } catch (error) {
        console.error('Error fetching leagues:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load your leagues',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

  const handleCreateLeague = async () => {
    try {
      const response = await api.post('/leagues', newLeague);
      setLeagues([...leagues, response.data]);
      setCreateDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'League created successfully!',
        severity: 'success'
      });
      setNewLeague({
        name: '',
        description: '',
        tiebreaker: false,
        isPrivate: true,
        sports: []
      });
    } catch (error) {
      console.error('Error creating league:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create league',
        severity: 'error'
      });
    }
  };

  const handleJoinLeague = async () => {
    try {
      const response = await api.post('/leagues/join', { inviteCode });
      setLeagues([...leagues, response.data]);
      setJoinDialogOpen(false);
      setInviteCode('');
      setSnackbar({
        open: true,
        message: 'Successfully joined the league!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error joining league:', error);
      setSnackbar({
        open: true,
        message: 'Failed to join league. Invalid invite code.',
        severity: 'error'
      });
    }
  };

  const handleLeaveLeague = async (leagueId) => {
    try {
      await api.post(`/leagues/${leagueId}/leave`);
      setLeagues(leagues.filter(league => league.id !== leagueId));
      setSnackbar({
        open: true,
        message: 'Successfully left the league',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error leaving league:', error);
      setSnackbar({
        open: true,
        message: 'Failed to leave league',
        severity: 'error'
      });
    }
  };

  const handleEditLeague = async () => {
    try {
      const response = await api.put(`/leagues/${selectedLeague.id}`, selectedLeague);
      setLeagues(leagues.map(league => 
        league.id === selectedLeague.id ? response.data : league
      ));
      setEditDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'League updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating league:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update league',
        severity: 'error'
      });
    }
  };

  const handleOpenEditDialog = (league) => {
    setSelectedLeague({...league});
    setEditDialogOpen(true);
  };

  const handleOpenMembersDialog = async (league) => {
    setSelectedLeague(league);
    setMembersDialogOpen(true);
    try {
      const response = await api.get(`/leagues/${league.id}/members`);
      setLeagueMembers(response.data);
    } catch (error) {
      console.error('Error fetching league members:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load league members',
        severity: 'error'
      });
    }
  };

  const handleOpenSportsDialog = async (league) => {
    setSelectedLeague(league);
    setSportsDialogOpen(true);
    try {
      const [sportsResponse, availableSportsResponse] = await Promise.all([
        api.get(`/leagues/${league.id}/sports`),
        api.get('/sports')
      ]);
      
      setLeagueSports(sportsResponse.data);
      
      // Filter out sports that are already in the league
      const leagueSportIds = new Set(sportsResponse.data.map(sport => sport.id));
      setAvailableSports(availableSportsResponse.data.filter(sport => !leagueSportIds.has(sport.id)));
    } catch (error) {
      console.error('Error fetching league sports:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load sports information',
        severity: 'error'
      });
    }
  };

  const handleAddSport = async () => {
    if (!selectedSport) return;
    
    try {
      await api.post(`/leagues/${selectedLeague.id}/sports`, { sportId: selectedSport });
      
      // Find the sport from available sports
      const sportToAdd = availableSports.find(sport => sport.id === selectedSport);
      
      // Update local state
      setLeagueSports([...leagueSports, sportToAdd]);
      setAvailableSports(availableSports.filter(sport => sport.id !== selectedSport));
      setSelectedSport('');
      
      setSnackbar({
        open: true,
        message: 'Sport added successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding sport to league:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add sport to league',
        severity: 'error'
      });
    }
  };

  const handleRemoveSport = async (sportId) => {
    try {
      await api.delete(`/leagues/${selectedLeague.id}/sports/${sportId}`);
      
      // Find the sport to remove
      const sportToRemove = leagueSports.find(sport => sport.id === sportId);
      
      // Update local state
      setLeagueSports(leagueSports.filter(sport => sport.id !== sportId));
      setAvailableSports([...availableSports, sportToRemove]);
      
      setSnackbar({
        open: true,
        message: 'Sport removed from league',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error removing sport from league:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove sport from league',
        severity: 'error'
      });
    }
  };

  const handleRemoveMember = async (userId) => {
    if (userId === currentUser.id) {
      // This is the current user, handle as "leave league"
      return handleLeaveLeague(selectedLeague.id);
    }
    
    try {
      await api.delete(`/leagues/${selectedLeague.id}/members/${userId}`);
      setLeagueMembers(leagueMembers.filter(member => member.id !== userId));
      setSnackbar({
        open: true,
        message: 'Member removed from league',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error removing member from league:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove member',
        severity: 'error'
      });
    }
  };

  const handleCopyInviteCode = (inviteCode) => {
    navigator.clipboard.writeText(inviteCode);
    setSnackbar({
      open: true,
      message: 'Invite code copied to clipboard!',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Manage Leagues
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={() => setJoinDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Join League
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setCreateDialogOpen(true)}
          >
            Create League
          </Button>
        </Box>
      </Box>
      
      {leagues.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 5 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            You're not a member of any leagues yet
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Create a new league or join an existing one to get started
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={() => setJoinDialogOpen(true)}
            >
              Join League
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => setCreateDialogOpen(true)}
            >
              Create League
            </Button>
          </Box>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {leagues.map(league => (
            <Grid item xs={12} md={6} lg={4} key={league.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {league.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {league.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={league.isAdmin ? "Admin" : "Member"} 
                      color={league.isAdmin ? "primary" : "default"}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={`${league.memberCount} Members`}
                      color="default"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={league.tiebreaker ? "Tiebreaker Enabled" : "No Tiebreaker"}
                      color={league.tiebreaker ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  {league.isAdmin && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Invite Code:
                      </Typography>
                      <Chip 
                        label={league.inviteCode}
                        size="small"
                        onDelete={() => handleCopyInviteCode(league.inviteCode)}
                        deleteIcon={<ContentCopyIcon />}
                      />
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<SportsIcon />}
                    onClick={() => handleOpenSportsDialog(league)}
                  >
                    Sports
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<PersonIcon />}
                    onClick={() => handleOpenMembersDialog(league)}
                  >
                    Members
                  </Button>
                  {league.isAdmin && (
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEditDialog(league)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => handleLeaveLeague(league.id)}
                  >
                    Leave
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Create League Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create League</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="League Name"
            fullWidth
            variant="outlined"
            value={newLeague.name}
            onChange={(e) => setNewLeague({...newLeague, name: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newLeague.description}
            onChange={(e) => setNewLeague({...newLeague, description: e.target.value})}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={newLeague.tiebreaker}
                onChange={(e) => setNewLeague({...newLeague, tiebreaker: e.target.checked})}
              />
            }
            label="Enable Tiebreaker"
          />
          <FormControlLabel
            control={
              <Switch
                checked={newLeague.isPrivate}
                onChange={(e) => setNewLeague({...newLeague, isPrivate: e.target.checked})}
              />
            }
            label="Private League"
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Sports</InputLabel>
            <Select
              multiple
              value={newLeague.sports}
              onChange={(e) => setNewLeague({...newLeague, sports: e.target.value})}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((sportId) => {
                    const sport = allSports.find(s => s.id === sportId);
                    return sport ? (
                      <Chip key={sportId} label={sport.name} size="small" />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {allSports.map((sport) => (
                <MenuItem key={sport.id} value={sport.id}>
                  {sport.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateLeague} 
            variant="contained"
            disabled={!newLeague.name || newLeague.sports.length === 0}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Join League Dialog */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Join League</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Invite Code"
            fullWidth
            variant="outlined"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleJoinLeague}
            variant="contained"
            disabled={!inviteCode}
          >
            Join
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit League Dialog */}
      {selectedLeague && (
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit League</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="League Name"
              fullWidth
              variant="outlined"
              value={selectedLeague.name}
              onChange={(e) => setSelectedLeague({...selectedLeague, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={selectedLeague.description}
              onChange={(e) => setSelectedLeague({...selectedLeague, description: e.target.value})}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={selectedLeague.tiebreaker}
                  onChange={(e) => setSelectedLeague({...selectedLeague, tiebreaker: e.target.checked})}
                />
              }
              label="Enable Tiebreaker"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={selectedLeague.isPrivate}
                  onChange={(e) => setSelectedLeague({...selectedLeague, isPrivate: e.target.checked})}
                />
              }
              label="Private League"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleEditLeague}
              variant="contained"
              disabled={!selectedLeague.name}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* League Members Dialog */}
      {selectedLeague && (
        <Dialog open={membersDialogOpen} onClose={() => setMembersDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedLeague.name} - Members</DialogTitle>
          <DialogContent>
            {leagueMembers.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                No members found
              </Typography>
            ) : (
              <List>
                {leagueMembers.map((member) => (
                  <React.Fragment key={member.id}>
                    <ListItem
                      secondaryAction={
                        selectedLeague.isAdmin && member.id !== currentUser.id && (
                          <Tooltip title="Remove member">
                            <IconButton 
                              edge="end" 
                              aria-label="delete" 
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={member.avatar}>{member.name.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={member.name} 
                        secondary={member.isAdmin ? "Admin" : "Member"} 
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMembersDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* League Sports Dialog */}
      {selectedLeague && (
        <Dialog open={sportsDialogOpen} onClose={() => setSportsDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedLeague.name} - Sports</DialogTitle>
          <DialogContent>
            {selectedLeague.isAdmin && (
              <Box sx={{ display: 'flex', mb: 2 }}>
                <FormControl fullWidth sx={{ mr: 1 }}>
                  <InputLabel>Add Sport</InputLabel>
                  <Select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    label="Add Sport"
                  >
                    {availableSports.map((sport) => (
                      <MenuItem key={sport.id} value={sport.id}>
                        {sport.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  onClick={handleAddSport}
                  disabled={!selectedSport}
                >
                  Add
                </Button>
              </Box>
            )}
            
            {leagueSports.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                No sports added to this league
              </Typography>
            ) : (
              <List>
                {leagueSports.map((sport) => (
                  <React.Fragment key={sport.id}>
                    <ListItem
                      secondaryAction={
                        selectedLeague.isAdmin && (
                          <Tooltip title="Remove sport">
                            <IconButton 
                              edge="end" 
                              aria-label="delete" 
                              onClick={() => handleRemoveSport(sport.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={sport.logo} alt={sport.name}>
                          <SportsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={sport.name} 
                        secondary={`Season: ${sport.currentSeason}`} 
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSportsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeagueManagement;