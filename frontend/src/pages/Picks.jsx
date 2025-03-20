import React, { useState, useEffect, useContext } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  CircularProgress, 
  Tooltip, 
  Snackbar, 
  Alert 
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AuthContext } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

const Picks = () => {
  const { weekId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [weekData, setWeekData] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [sports, setSports] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [picks, setPicks] = useState({});
  const [savedPicks, setSavedPicks] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchUserLeagues = async () => {
      try {
        const response = await api.get('/leagues/user');
        setLeagues(response.data);
        if (response.data.length > 0) {
          setSelectedLeague(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load your leagues',
          severity: 'error'
        });
      }
    };

    fetchUserLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      const fetchLeagueSports = async () => {
        try {
          const response = await api.get(`/leagues/${selectedLeague}/sports`);
          setSports(response.data);
          if (response.data.length > 0) {
            setSelectedSport(response.data[0].id);
          }
        } catch (error) {
          console.error('Error fetching sports:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load sports for this league',
            severity: 'error'
          });
        }
      };

      fetchLeagueSports();
    }
  }, [selectedLeague]);

  useEffect(() => {
    if (selectedSport) {
      const fetchWeeks = async () => {
        try {
          const response = await api.get(`/sports/${selectedSport}/weeks`);
          setWeeks(response.data);
          
          // Find current week
          const currentWeekData = response.data.find(week => week.isCurrent);
          setCurrentWeek(currentWeekData);
          
          // If no weekId provided, use current week
          const targetWeek = weekId || (currentWeekData ? currentWeekData.id : null);
          
          if (targetWeek) {
            navigate(`/picks/${targetWeek}`, { replace: !weekId });
            fetchWeekGames(targetWeek);
          }
        } catch (error) {
          console.error('Error fetching weeks:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load weeks for this sport',
            severity: 'error'
          });
        }
      };

      fetchWeeks();
    }
  }, [selectedSport, weekId, navigate]);

  const fetchWeekGames = async (weekId) => {
    if (!weekId || !selectedSport || !selectedLeague) return;
    
    setLoading(true);
    try {
      const [gamesResponse, picksResponse] = await Promise.all([
        api.get(`/sports/${selectedSport}/weeks/${weekId}/games`),
        api.get(`/leagues/${selectedLeague}/sports/${selectedSport}/weeks/${weekId}/picks`)
      ]);

      setWeekData(gamesResponse.data);
      
      // Convert user picks to the required format
      const userPicks = {};
      picksResponse.data.forEach(pick => {
        userPicks[pick.gameId] = pick.teamId;
      });
      
      setPicks(userPicks);
      setSavedPicks({...userPicks});
    } catch (error) {
      console.error('Error fetching week data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load games for this week',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueChange = (event) => {
    setSelectedLeague(event.target.value);
  };

  const handleSportChange = (event) => {
    setSelectedSport(event.target.value);
  };

  const handleWeekChange = (weekId) => {
    navigate(`/picks/${weekId}`);
  };

  const handlePickChange = (gameId, teamId) => {
    setPicks(prev => ({
      ...prev,
      [gameId]: teamId
    }));
  };

  const handleSubmitPicks = async () => {
    setSubmitting(true);
    try {
      // Find games that have changed or are new
      const picksToSubmit = [];
      
      for (const [gameId, teamId] of Object.entries(picks)) {
        if (savedPicks[gameId] !== teamId) {
          picksToSubmit.push({ gameId, teamId });
        }
      }
      
      if (picksToSubmit.length === 0) {
        setSnackbar({
          open: true,
          message: 'No changes to submit',
          severity: 'info'
        });
        setSubmitting(false);
        return;
      }
      
      await api.post(`/leagues/${selectedLeague}/sports/${selectedSport}/weeks/${weekId || currentWeek.id}/picks`, {
        picks: picksToSubmit
      });
      
      setSavedPicks({...picks});
      setSnackbar({
        open: true,
        message: 'Picks submitted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting picks:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit picks',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
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

  const hasUnsavedChanges = () => {
    for (const gameId in picks) {
      if (picks[gameId] !== savedPicks[gameId]) {
        return true;
      }
    }
    return false;
  };

  const isGameStarted = (game) => {
    return new Date(game.startTime) <= new Date();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Make Your Picks
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>League</InputLabel>
            <Select
              value={selectedLeague}
              onChange={handleLeagueChange}
              label="League"
            >
              {leagues.map(league => (
                <MenuItem key={league.id} value={league.id}>
                  {league.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Sport</InputLabel>
            <Select
              value={selectedSport}
              onChange={handleSportChange}
              label="Sport"
              disabled={!selectedLeague}
            >
              {sports.map(sport => (
                <MenuItem key={sport.id} value={sport.id}>
                  {sport.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Week</InputLabel>
            <Select
              value={weekId || (currentWeek ? currentWeek.id : '')}
              onChange={(e) => handleWeekChange(e.target.value)}
              label="Week"
              disabled={!selectedSport}
            >
              {weeks.map(week => (
                <MenuItem key={week.id} value={week.id}>
                  {week.name} {week.isCurrent && '(Current)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {weekData && weekData.games && weekData.games.length > 0 ? (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              {weekData.name} Games
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmitPicks}
              disabled={submitting || !hasUnsavedChanges()}
            >
              {submitting ? <CircularProgress size={24} /> : 'Save Picks'}
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {weekData.games.map(game => {
              const gameStarted = isGameStarted(game);
              const homeSelected = picks[game.id] === game.homeTeam.id;
              const awaySelected = picks[game.id] === game.awayTeam.id;
              const gameTime = new Date(game.startTime);
              
              return (
                <Grid item xs={12} md={6} key={game.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      position: 'relative',
                      backgroundColor: gameStarted ? '#f8f8f8' : 'white',
                    }}
                  >
                    {gameStarted && (
                      <Chip 
                        label="Game Started" 
                        color="primary" 
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          top: 8, 
                          right: 8 
                        }} 
                      />
                    )}
                    
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        {format(gameTime, 'EEE, MMM d, yyyy h:mm a')}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        {game.venue}
                      </Typography>
                      
                      <Tooltip title={`${game.homeTeam.name} ${game.spread > 0 ? '+' : ''}${game.spread}`}>
                        <Button
                          variant={homeSelected ? "contained" : "outlined"}
                          fullWidth
                          sx={{ mb: 1, justifyContent: 'space-between', py: 1.5 }}
                          onClick={() => !gameStarted && handlePickChange(game.id, game.homeTeam.id)}
                          disabled={gameStarted}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <img 
                              src={game.homeTeam.logo} 
                              alt={game.homeTeam.name} 
                              style={{ width: 24, height: 24, marginRight: 8 }} 
                            />
                            <Typography variant="body1">
                              {game.homeTeam.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {game.spread > 0 ? `+${game.spread}` : game.spread}
                          </Typography>
                        </Button>
                      </Tooltip>
                      
                      <Tooltip title={`${game.awayTeam.name} ${game.spread < 0 ? '' : '+'}${-game.spread}`}>
                        <Button
                          variant={awaySelected ? "contained" : "outlined"}
                          fullWidth
                          sx={{ justifyContent: 'space-between', py: 1.5 }}
                          onClick={() => !gameStarted && handlePickChange(game.id, game.awayTeam.id)}
                          disabled={gameStarted}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <img 
                              src={game.awayTeam.logo} 
                              alt={game.awayTeam.name} 
                              style={{ width: 24, height: 24, marginRight: 8 }} 
                            />
                            <Typography variant="body1">
                              {game.awayTeam.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {game.spread < 0 ? `${-game.spread}` : `+${-game.spread}`}
                          </Typography>
                        </Button>
                      </Tooltip>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmitPicks}
              disabled={submitting || !hasUnsavedChanges()}
              size="large"
            >
              {submitting ? <CircularProgress size={24} /> : 'Save Picks'}
            </Button>
          </Box>
        </>
      ) : (
        <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
          No games available for this week. Please select a different week or sport.
        </Typography>
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

export default Picks;
