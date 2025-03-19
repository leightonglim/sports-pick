// src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Divider, 
  Alert, 
  CircularProgress, 
  Chip 
} from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import SportsHockeyIcon from '@mui/icons-material/SportsHockey';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../contexts/AuthContext';
import { leagueService, sportsService, picksService } from '../services/api';

const sportIcons = {
  NFL: <DirectionsRunIcon />,
  MLB: <SportsBaseballIcon />,
  NBA: <SportsBasketballIcon />,
  NHL: <SportsHockeyIcon />,
  Soccer: <SportsSoccerIcon />
};

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState([]);
  const [activeSports, setActiveSports] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [leaguesResponse, sportsResponse] = await Promise.all([
          leagueService.getLeagues(),
          sportsService.getSports()
        ]);
        
        setLeagues(leaguesResponse.data);
        
        // For each sport, get the current week
        const sportsWithWeeks = await Promise.all(
          sportsResponse.data.map(async (sport) => {
            const weekResponse = await sportsService.getCurrentWeek(sport.id);
            return {
              ...sport,
              currentWeek: weekResponse.data.week,
              isActive: weekResponse.data.isActive
            };
          })
        );
        
        setActiveSports(sportsWithWeeks.filter(sport => sport.isActive));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (leagues.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>Welcome to Pick'em Pro!</Typography>
        <Alert severity="info" sx={{ mb: 4 }}>
          You haven't joined any leagues yet. Create a new league or join an existing one to get started!
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Create a League</Typography>
                <Typography variant="body1">
                  Start your own Pick'em league and invite friends to join.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/leagues/create')}
                  endIcon={<ArrowForwardIcon />}
                >
                  Create League
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Join a League</Typography>
                <Typography variant="body1">
                  Join an existing league with an invitation code.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={() => navigate('/leagues')}
                  endIcon={<ArrowForwardIcon />}
                >
                  Join League
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome back, {currentUser.firstName || currentUser.username}!
      </Typography>
      
      {activeSports.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          There are no active sports seasons at the moment. Check back later!
        </Alert>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>Make Your Picks</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Current active sports that need your picks:
          </Typography>
          
          <Grid container spacing={3}>
            {activeSports.map((sport) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={sport.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {sportIcons[sport.name] || <SportsSoccerIcon />}
                      <Typography variant="h6" sx={{ ml: 1 }}>{sport.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Week: {sport.currentWeek}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => navigate(`/picks?sportId=${sport.id}&week=${sport.currentWeek}`)}
                    >
                      Make Picks
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      <Divider sx={{ my: 4 }} />
      
      <Box>
        <Typography variant="h5" gutterBottom>Your Leagues</Typography>
        <Grid container spacing={3}>
          {leagues.map((league) => (
            <Grid item xs={12} sm={6} md={4} key={league.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{league.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {league.members} members
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {league.sports.map((sport) => (
                      <Chip 
                        key={sport.id} 
                        label={sport.name} 
                        size="small" 
                        icon={sportIcons[sport.name] || <SportsSoccerIcon />} 
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/leagues/${league.id}`)}
                  >
                    View League
                  </Button>
                  <Button 
                    size="small" 
                    color="secondary" 
                    onClick={() => navigate(`/standings/${league.id}`)}
                  >
                    Standings
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>Join or Create New League</Typography>
                <Typography variant="body2" color="text.secondary">
                  Expand your competition by joining more leagues or create your own!
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/leagues')}
                >
                  Manage Leagues
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Home;