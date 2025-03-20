import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leagueService, gamesService, picksService, sportsService } from '../services/apiService';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  SportsSoccer,
  SportsFootball,
  SportsBasketball,
  SportsHockey,
  SportsBaseball,
  ArrowBack,
  ArrowForward,
  Today,
  CheckCircle,
  Info
} from '@mui/icons-material';

const WeeklyGames = () => {
  const { leagueId, sport } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [league, setLeague] = useState(null);
  const [games, setGames] = useState([]);
  const [selectedSport, setSelectedSport] = useState(sport || '');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [availableSeasons, setAvailableSeasons] = useState([]);
  const [sportTabValue, setSportTabValue] = useState(0);
  const [userPicks, setUserPicks] = useState({});

  useEffect(() => {
    fetchLeagueData();
  }, [leagueId]);

  useEffect(() => {
    if (league && league.sports.length > 0) {
      // Find the index of the requested sport in the league's sports array
      const sportIndex = league.sports.findIndex(s => s === sport);
      if (sportIndex >= 0) {
        setSportTabValue(sportIndex);
      }
      setSelectedSport(league.sports[sportTabValue]);
    }
  }, [league, sport, sportTabValue]);

  useEffect(() => {
    if (selectedSport) {
      fetchAvailableSeasons();
    }
  }, [selectedSport]);

  useEffect(() => {
    if (selectedSport && selectedSeason) {
      fetchAvailableWeeks();
    }
  }, [selectedSport, selectedSeason]);

  useEffect(() => {
    if (selectedSport && selectedSeason && selectedWeek) {
      fetchGames();
      fetchUserPicks();
    }
  }, [selectedSport, selectedSeason, selectedWeek]);

  const fetchLeagueData = async () => {
    try {
      setLoading(true);
      const response = await leagueService.getLeague(leagueId);
      setLeague(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching league data:', error);
      setError('Failed to load league data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSeasons = async () => {
    try {
      // Since there's no specific seasons endpoint in the apiService,
      // we could add this to sportsService or handle it here
      // For now, using a mock implementation
      const seasons = ["2024", "2023", "2022"];
      setAvailableSeasons(seasons);
      
      if (seasons.length > 0) {
        setSelectedSeason(seasons[0]); // Select the most recent season by default
      } else {
        setSelectedSeason('');
      }
    } catch (error) {
      console.error('Error fetching available seasons:', error);
    }
  };

  const fetchAvailableWeeks = async () => {
    try {
      const response = await sportsService.getWeeks(selectedSport);
      setAvailableWeeks(response.data);
      
      if (response.data.length > 0) {
        // Find the current week (or closest future week)
        const currentWeek = await sportsService.getCurrentWeek(selectedSport);
        if (currentWeek.data && response.data.includes(currentWeek.data.week)) {
          setSelectedWeek(currentWeek.data.week);
        } else {
          setSelectedWeek(response.data[0]); // Default to first week
        }
      } else {
        setSelectedWeek('');
      }
    } catch (error) {
      console.error('Error fetching available weeks:', error);
    }
  };

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await gamesService.getGames(selectedSport, selectedWeek);
      setGames(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching games:', error);
      setError('Failed to load games');
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPicks = async () => {
    try {
      const response = await picksService.getUserPicks(leagueId, selectedSport, selectedWeek);
      
      // Transform the array of picks into an object keyed by gameId for easy lookup
      const picksMap = {};
      response.data.forEach(pick => {
        picksMap[pick.gameId] = pick;
      });
      
      setUserPicks(picksMap);
    } catch (error) {
      console.error('Error fetching user picks:', error);
      setUserPicks({});
    }
  };

  const handleSportTabChange = (event, newValue) => {
    setSportTabValue(newValue);
  };

  const handleSeasonChange = (event) => {
    setSelectedSeason(event.target.value);
  };

  const handleWeekChange = (event) => {
    setSelectedWeek(event.target.value);
  };

  const handleNavigateToMakePicks = (gameId) => {
    navigate(`/leagues/${leagueId}/picks/${selectedSport}/${selectedSeason}/${selectedWeek}/${gameId}`);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const navigateToAdjacentWeek = (direction) => {
    const currentIndex = availableWeeks.indexOf(selectedWeek);
    if (direction === 'next' && currentIndex < availableWeeks.length - 1) {
      setSelectedWeek(availableWeeks[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedWeek(availableWeeks[currentIndex - 1]);
    }
  };

  const isGameInPast = (gameTime) => {
    return new Date(gameTime) < new Date();
  };

  const hasUserPicked = (gameId) => {
    return userPicks[gameId] !== undefined;
  };

  if (loading && !league) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !league) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate(`/leagues/${leagueId}`)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Weekly Games
          </Typography>
        </Box>

        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {league?.name}
        </Typography>

        {league?.sports.length > 0 ? (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={sportTabValue} 
                onChange={handleSportTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                {league.sports.map((sport, index) => (
                  <Tab 
                    key={sport} 
                    label={sport} 
                    icon={getSportIcon(sport)} 
                    iconPosition="start"
                  />
                ))}
              </Tabs>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Season</InputLabel>
                  <Select
                    value={selectedSeason}
                    label="Season"
                    onChange={handleSeasonChange}
                    disabled={availableSeasons.length === 0}
                  >
                    {availableSeasons.map((season) => (
                      <MenuItem key={season} value={season}>
                        {season}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    onClick={() => navigateToAdjacentWeek('prev')}
                    disabled={availableWeeks.indexOf(selectedWeek) === 0}
                  >
                    <ArrowBack />
                  </IconButton>
                  
                  <FormControl fullWidth sx={{ mx: 2 }}>
                    <InputLabel>Week</InputLabel>
                    <Select
                      value={selectedWeek}
                      label="Week"
                      onChange={handleWeekChange}
                      disabled={availableWeeks.length === 0}
                    >
                      {availableWeeks.map((week) => (
                        <MenuItem key={week} value={week}>
                          Week {week}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <IconButton 
                    onClick={() => navigateToAdjacentWeek('next')}
                    disabled={availableWeeks.indexOf(selectedWeek) === availableWeeks.length - 1}
                  >
                    <ArrowForward />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : games.length > 0 ? (
              <Grid container spacing={3}>
                {games.map((game) => {
                  const isPastGame = isGameInPast(game.gameTime);
                  const userHasPicked = hasUserPicked(game.id);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={game.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          bgcolor: isPastGame ? 'action.disabledBackground' : 'background.paper'
                        }}
                      >
                        {userHasPicked && (
                          <Badge 
                            badgeContent={<CheckCircle color="success" />}
                            sx={{ 
                              position: 'absolute', 
                              top: 10, 
                              right: 10,
                              '& .MuiBadge-badge': {
                                bgcolor: 'transparent',
                                p: 0
                              }
                            }}
                          />
                        )}
                        
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Today fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(game.gameTime)}
                            </Typography>
                          </Box>
                          
                          <Typography variant="h6" component="div" sx={{ mb: 2 }}>
                            {game.awayTeam} @ {game.homeTeam}
                          </Typography>
                          
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Location:
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                {game.venue}
                              </Typography>
                            </Grid>
                            
                            {game.line && (
                              <>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Line:
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2">
                                    {game.favorite} {game.line > 0 ? `+${game.line}` : game.line}
                                  </Typography>
                                </Grid>
                              </>
                            )}
                            
                            {game.completed && (
                              <>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Final Score:
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2">
                                    {game.awayScore} - {game.homeScore}
                                  </Typography>
                                </Grid>
                              </>
                            )}
                          </Grid>
                          
                          {userHasPicked && (
                            <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Your pick: <strong>{userPicks[game.id].pickedTeam}</strong>
                                {userPicks[game.id].result && (
                                  <Chip 
                                    label={userPicks[game.id].result} 
                                    size="small"
                                    color={
                                      userPicks[game.id].result === 'WIN' ? 'success' : 
                                      userPicks[game.id].result === 'LOSS' ? 'error' : 
                                      'warning'
                                    }
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                        
                        <CardActions>
                          <Button 
                            size="small" 
                            variant="contained" 
                            fullWidth
                            onClick={() => handleNavigateToMakePicks(game.id)}
                            disabled={isPastGame && !userHasPicked}
                          >
                            {userHasPicked ? 'View/Edit Pick' : 'Make Pick'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Alert severity="info">
                No games available for the selected criteria.
              </Alert>
            )}
          </>
        ) : (
          <Alert severity="info">
            This league has no sports configured. Please add sports to the league to view games.
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default WeeklyGames;