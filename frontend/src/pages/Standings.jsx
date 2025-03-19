import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress, 
  Tabs, 
  Tab, 
  Chip, 
  Tooltip, 
  Avatar, 
  useTheme 
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Standings = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(leagueId || '');
  const [selectedSport, setSelectedSport] = useState('');
  const [sports, setSports] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leagueInfo, setLeagueInfo] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchUserLeagues = async () => {
      try {
        const response = await api.get('/leagues/user');
        setLeagues(response.data);
        if (response.data.length > 0 && !selectedLeague) {
          setSelectedLeague(response.data[0].id);
          navigate(`/leaderboard/${response.data[0].id}`, { replace: true });
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
      }
    };

    fetchUserLeagues();
  }, [navigate, selectedLeague]);

  useEffect(() => {
    if (selectedLeague) {
      const fetchLeagueInfo = async () => {
        try {
          const response = await api.get(`/leagues/${selectedLeague}`);
          setLeagueInfo(response.data);
        } catch (error) {
          console.error('Error fetching league info:', error);
        }
      };

      const fetchLeagueSports = async () => {
        try {
          const response = await api.get(`/leagues/${selectedLeague}/sports`);
          setSports(response.data);
          if (response.data.length > 0) {
            setSelectedSport(response.data[0].id);
          }
        } catch (error) {
          console.error('Error fetching sports:', error);
        }
      };

      fetchLeagueInfo();
      fetchLeagueSports();
    }
  }, [selectedLeague]);

  useEffect(() => {
    if (selectedLeague && selectedSport) {
      fetchLeaderboard();
    }
  }, [selectedLeague, selectedSport]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/leagues/${selectedLeague}/sports/${selectedSport}/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueChange = (event) => {
    const newLeagueId = event.target.value;
    setSelectedLeague(newLeagueId);
    navigate(`/leaderboard/${newLeagueId}`);
  };

  const handleSportChange = (event) => {
    setSelectedSport(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading && !leaderboard.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        League Leaderboard
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <FormControl sx={{ minWidth: 200, mr: 2 }}>
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
        
        <FormControl sx={{ minWidth: 200 }}>
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
      </Box>
      
      {leagueInfo && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {leagueInfo.name}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {leagueInfo.description}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip 
              label={leagueInfo.tiebreaker ? "Tiebreaker Enabled" : "No Tiebreaker"} 
              color={leagueInfo.tiebreaker ? "primary" : "default"}
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip 
              label={`${leagueInfo.memberCount} Members`}
              color="default"
              size="small"
            />
          </Box>
        </Box>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Season" />
          <Tab label="Last 4 Weeks" />
          <Tab label="Weekly" />
        </Tabs>
      </Box>
      
      {leaderboard.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="center">Correct Picks</TableCell>
                <TableCell align="center">Total Picks</TableCell>
                <TableCell align="center">Win %</TableCell>
                {leagueInfo && leagueInfo.tiebreaker && (
                  <TableCell align="center">Tiebreaker Points</TableCell>
                )}
                <TableCell align="center">Last Week</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry, index) => (
                <TableRow 
                  key={entry.userId} 
                  sx={{ 
                    backgroundColor: index < 3 ? `${theme.palette.primary.main}11` : 'inherit',
                    '&:hover': { backgroundColor: `${theme.palette.primary.main}22` },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {index + 1}
                      {index < 3 && (
                        <Chip 
                          label={["🥇", "🥈", "🥉"][index]} 
                          size="small" 
                          sx={{ ml: 1, minWidth: 30 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={entry.userAvatar} 
                        alt={entry.userName}
                        sx={{ width: 30, height: 30, mr: 1 }}
                      >
                        {entry.userName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">
                        {entry.userName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{entry.correctPicks}</TableCell>
                  <TableCell align="center">{entry.totalPicks}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={`${((entry.correctPicks / entry.totalPicks) * 100).toFixed(1)}%`}
                      color={
                        (entry.correctPicks / entry.totalPicks) > 0.7 ? "success" :
                        (entry.correctPicks / entry.totalPicks) > 0.5 ? "primary" : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  {leagueInfo && leagueInfo.tiebreaker && (
                    <TableCell align="center">{entry.tiebreakerPoints}</TableCell>
                  )}
                  <TableCell align="center">
                    <Tooltip title={`${entry.lastWeekCorrect} correct of ${entry.lastWeekTotal}`}>
                      <Chip 
                        label={`${entry.lastWeekCorrect}/${entry.lastWeekTotal}`}
                        color={
                          (entry.lastWeekCorrect / entry.lastWeekTotal) > 0.7 ? "success" :
                          (entry.lastWeekCorrect / entry.lastWeekTotal) > 0.5 ? "primary" : "default"
                        }
                        size="small"
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
          No leaderboard data available for this league and sport.
        </Typography>
      )}
    </Box>
  );
};

export default Standings;