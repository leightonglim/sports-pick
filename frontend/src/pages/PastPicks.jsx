import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leagueService, picksService, gamesService } from '../services/apiService';
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  RemoveCircle,
  SportsSoccer,
  SportsFootball,
  SportsBasketball,
  SportsHockey,
  SportsBaseball,
  ArrowBack,
  Info
} from '@mui/icons-material';

const PastPicks = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [league, setLeague] = useState(null);
  const [picks, setPicks] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [availableSeasons, setAvailableSeasons] = useState([]);
  const [sportTabValue, setSportTabValue] = useState(0);

  useEffect(() => {
    fetchLeagueData();
  }, [leagueId]);

  useEffect(() => {
    if (league && league.sports.length > 0) {
      setSelectedSport(league.sports[sportTabValue]);
    }
  }, [league, sportTabValue]);

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
      fetchPicks();
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
      // Assuming you have an endpoint in gamesService for getting seasons
      // If not, you'll need to add this to your API service
      const response = await gamesService.getSeasons(selectedSport);
      setAvailableSeasons(response.data);
      
      if (response.data.length > 0) {
        setSelectedSeason(response.data[0]); // Select the most recent season by default
      } else {
        setSelectedSeason('');
      }
    } catch (error) {
      console.error('Error fetching available seasons:', error);
    }
  };

  const fetchAvailableWeeks = async () => {
    try {
      // Using the sportsService's getWeeks method would be more appropriate here
      const response = await gamesService.getWeeks(selectedSport, selectedSeason);
      setAvailableWeeks(response.data);
      
      if (response.data.length > 0) {
        setSelectedWeek(response.data[0]); // Select the most recent week by default
      } else {
        setSelectedWeek('');
      }
    } catch (error) {
      console.error('Error fetching available weeks:', error);
    }
  };

  const fetchPicks = async () => {
    try {
      setLoading(true);
      // Using picksService instead of direct API call
      const response = await picksService.getPastPicks(leagueId, selectedSport, selectedSeason, selectedWeek);
      setPicks(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching picks:', error);
      setError('Failed to load picks');
      setPicks([]);
    } finally {
      setLoading(false);
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

  const getResultIcon = (result) => {
    switch (result) {
      case 'WIN':
        return <CheckCircle color="success" />;
      case 'LOSS':
        return <Cancel color="error" />;
      case 'PUSH':
        return <RemoveCircle color="warning" />;
      default:
        return null;
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

  const calculateOverallRecord = () => {
    if (!picks.length) return { wins: 0, losses: 0, pushes: 0 };
    
    return picks.reduce((acc, pick) => {
      if (pick.result === 'WIN') acc.wins++;
      else if (pick.result === 'LOSS') acc.losses++;
      else if (pick.result === 'PUSH') acc.pushes++;
      return acc;
    }, { wins: 0, losses: 0, pushes: 0 });
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

  const record = calculateOverallRecord();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate(`/leagues/${leagueId}`)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Past Picks
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
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
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
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%', 
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  p: 1
                }}>
                  <Typography variant="body1" mr={2}>
                    Record:
                  </Typography>
                  <Chip 
                    label={`${record.wins}-${record.losses}${record.pushes > 0 ? `-${record.pushes}` : ''}`} 
                    color={record.wins > record.losses ? "success" : record.wins < record.losses ? "error" : "default"}
                    variant="outlined"
                  />
                </Box>
              </Grid>
            </Grid>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : picks.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Game</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Pick</TableCell>
                      <TableCell>Line</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {picks.map((pick) => (
                      <TableRow key={pick.id}>
                        <TableCell>
                          {pick.game.awayTeam} @ {pick.game.homeTeam}
                        </TableCell>
                        <TableCell>{formatDate(pick.game.gameTime)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {pick.pickedTeam}
                            {pick.pickedTeam === pick.game.homeTeam && (
                              <Tooltip title="Home Team">
                                <Info fontSize="small" color="action" sx={{ ml: 1 }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {pick.line ? (pick.line > 0 ? `+${pick.line}` : pick.line) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getResultIcon(pick.result)} 
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {pick.result}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {pick.game.completed ? 
                            `${pick.game.awayScore} - ${pick.game.homeScore}` : 
                            'Not completed'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No picks found for the selected criteria.
              </Alert>
            )}
          </>
        ) : (
          <Alert severity="info">
            This league has no sports configured. Please add sports to the league to make picks.
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default PastPicks;