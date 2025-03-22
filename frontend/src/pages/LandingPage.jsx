import React, { useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Stack,
  Card,
  CardContent,
  CardMedia,
  Divider
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Importing icons safely
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsBaseballIcon from '@mui/icons-material/SportsBasketball'; // Fixed duplicate icon
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import InsightsIcon from '@mui/icons-material/Insights';

// Added error handling for component rendering
const LandingPage = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard');
    }
  }, [loading, currentUser, navigate]);

  // Optional: Add error catching for date method
  const getCurrentYear = () => {
    try {
      return new Date().getFullYear();
    } catch (error) {
      console.error("Error getting current year:", error);
      return 2025; // Fallback year
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Test Your Sports Knowledge
              </Typography>
              <Typography variant="h5" paragraph gutterBottom sx={{ mb: 4 }}>
                Join leagues, make picks, and compete with friends in our sports pick 'em platform.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button 
                  component={Link} 
                  to="/register" 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                >
                  Sign Up Free
                </Button>
                <Button 
                  component={Link} 
                  to="/login" 
                  variant="outlined" 
                  color="inherit" 
                  size="large"
                >
                  Log In
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={8} 
                sx={{ 
                  p: 4, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom color="text.primary">
                  Featured Sports
                </Typography>
                <Stack 
                  direction="row" 
                  spacing={3} 
                  sx={{ 
                    mt: 2, 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}
                >
                  <SportsFootballIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  <SportsBasketballIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  <SportsSoccerIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  {/* Removed problematic icon that was duplicating SportsBasketballIcon */}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          How It Works
        </Typography>
        <Divider sx={{ mb: 4 }} />
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardMedia
                component="div"
                sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.light' }}
              >
                <EmojiEventsIcon sx={{ fontSize: 64, color: 'primary.contrastText' }} />
              </CardMedia>
              <CardContent>
                <Typography gutterBottom variant="h5" component="h3">
                  Create or Join Leagues
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create your own league or join existing ones. Customize league settings and invite friends to compete.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardMedia
                component="div"
                sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'secondary.light' }}
              >
                <GroupIcon sx={{ fontSize: 64, color: 'secondary.contrastText' }} />
              </CardMedia>
              <CardContent>
                <Typography gutterBottom variant="h5" component="h3">
                  Make Your Picks
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Make weekly picks for your favorite sports. Our platform automatically fetches games and updates results.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardMedia
                component="div"
                sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'info.light' }}
              >
                <InsightsIcon sx={{ fontSize: 64, color: 'info.contrastText' }} />
              </CardMedia>
              <CardContent>
                <Typography gutterBottom variant="h5" component="h3">
                  Track Your Performance
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  See how your picks compare to others in your league with our detailed leaderboards and statistics.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 6 }}>
        <Container maxWidth="md">
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Ready to Make Your Picks?
            </Typography>
            <Typography variant="body1" paragraph>
              Join thousands of sports fans who are already competing and having fun!
            </Typography>
            <Button 
              component={Link} 
              to="/register" 
              variant="contained" 
              color="primary" 
              size="large"
              sx={{ mt: 2 }}
            >
              Get Started Now
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {getCurrentYear()} Sports Pick 'Em App. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;