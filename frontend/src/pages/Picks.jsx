import React, { useState, useEffect } from 'react';
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
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { leagueService, picksService, gamesService, sportsService } from '../services/apiService';

const Picks = () => {
  const { weekId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [weekData, setWeekData] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [sports, setSports] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [picks, setPicks] = useState({});
  const [savedPicks, setSavedPicks] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Fetch user leagues
  useEffect(() => {
    const fetchUserLeagues = async () => {
      try {
        setLeaguesLoading(true);
        const response = await leagueService.getLeagues();
        setLeagues(response.data);
        if (response.data.length > 0) {
          setSelectedLeague(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to load your leagues',
          severity: 'error',
        });
      } finally {
        setLeaguesLoading(false);
      }
    };

    fetchUserLeagues();
  }, []);

  // Fetch league sports when selected league changes
  useEffect(() => {
    if (selectedLeague) {
      const fetchLeagueSports = async () => {
        try {
          const response = await leagueService.getLeague(selectedLeague);
          setSports(response.data.sports || []);
          if (response.data.sports && response.data.sports.length > 0) {
            setSelectedSport(response.data.sports[0].id);
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

  // Fetch current week when sport changes
  useEffect(() => {
    if (selectedSport) {
      const fetchCurrentWeek = async () => {
        try {
          const currentWeekResponse = await sportsService.getCurrentWeek(selectedSport);
          
          // Assuming getCurrentWeek returns an array and we want the first matching week
          if (currentWeekResponse.data && currentWeekResponse.data.length > 0) {
            const currentWeekData = currentWeekResponse.data[0];
            setCurrentWeek(currentWeekData);
            
            // If no weekId is provided, navigate to the current week
            if (!weekId) {
              navigate(`/picks/${currentWeekData.id}`, { replace: true });
            } else {
              fetchWeekGames(weekId);
            }
          }
        } catch (error) {
          console.error('Error fetching current week:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load current week',
            severity: 'error',
          });
        }
      };

      fetchCurrentWeek();
    }
  }, [selectedSport, weekId, navigate]);

  const fetchWeekGames = async (weekId) => {
    if (!weekId || !selectedSport || !selectedLeague) return;
    
    setLoading(true);
    try {
      // Get games for the week
      const gamesResponse = await gamesService.getGames(selectedSport, weekId);
      
      // Get user's picks
      const picksResponse = await picksService.getUserPicks(selectedLeague, selectedSport, weekId);
      
      // Transform games to match the expected structure
      const transformedGames = gamesResponse.data.map(game => ({
        id: game.id,
        startTime: game.game_time,
        venue: game.venue,
        homeTeam: {
          id: game.home_team,
          name: game.home_team,
          logo: game.home_team_logo || '/default-team-logo.png', // Add a default logo path
          spread: game.spread
        },
        awayTeam: {
          id: game.away_team,
          name: game.away_team,
          logo: game.away_team_logo || '/default-team-logo.png', // Add a default logo path
          spread: -game.spread
        }
      }));
      
      setWeekData({
        name: `Week ${game.week}`, // Adjust as needed
        games: transformedGames
      });
      
      // Convert user picks to the required format
      const userPicks = {};
      if (picksResponse.data && Array.isArray(picksResponse.data)) {
        picksResponse.data.forEach(pick => {
          userPicks[pick.gameId] = pick.teamId;
        });
      }
      
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

  // Rest of the component remains the same as in the original code...
  // (handleLeagueChange, handleSportChange, handleWeekChange, etc.)

  // In the render method, update the game rendering part to use the new data structure
  return (
    <Box sx={{ p: 3 }}>
      {/* ... previous code remains the same ... */}
      
      {weekData && weekData.games && weekData.games.length > 0 ? (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              {weekData.name}
            </Typography>
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
          
          <Grid container spacing={3}>
            {weekData.games.map(game => {
              const gameStarted = isGameStarted(game);
              const homeSelected = picks[game.id] === game.homeTeam.id;
              const awaySelected = picks[game.id] === game.awayTeam.id;
              const gameTime = parseISO(game.startTime);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
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
                      
                      <Tooltip title={`${game.homeTeam.name} ${game.homeTeam.spread > 0 ? '+' : ''}${game.homeTeam.spread}`}>
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
                            {game.homeTeam.spread > 0 ? `+${game.homeTeam.spread}` : game.homeTeam.spread}
                          </Typography>
                        </Button>
                      </Tooltip>
                      
                      <Tooltip title={`${game.awayTeam.name} ${game.awayTeam.spread < 0 ? '' : '+'}${game.awayTeam.spread}`}>
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
                            {game.awayTeam.spread < 0 ? `${game.awayTeam.spread}` : `+${game.awayTeam.spread}`}
                          </Typography>
                        </Button>
                      </Tooltip>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          
          {/* Rest of the component remains the same */}
        </>
      ) : (
        <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
          No games available for this week. Please select a different week or sport.
        </Typography>
      )}
    </Box>
  );
};

export default Picks;