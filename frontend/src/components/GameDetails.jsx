import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Chip,
  Grid 
} from '@mui/material';
import { format } from 'date-fns';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const GameDetails = ({ game }) => {
  // Convert game time to user's local time
  const gameTime = game.gameTime ? new Date(game.gameTime) : null;
  const formattedDate = gameTime ? format(gameTime, 'EEEE, MMMM d, yyyy') : 'TBD';
  const formattedTime = gameTime ? format(gameTime, 'h:mm a') : 'TBD';

  // Format betting line
  const formatBettingLine = () => {
    if (!game.spreadHome && game.spreadHome !== 0) return 'Even';
    
    const favoredTeam = game.spreadHome < 0 ? game.homeTeam.name : game.awayTeam.name;
    const underdogTeam = game.spreadHome < 0 ? game.awayTeam.name : game.homeTeam.name;
    const line = Math.abs(game.spreadHome);
    
    return (
      <>
        <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
          {favoredTeam}
        </Typography>
        <Typography variant="body2" component="span">
          {` -${line} | `}
        </Typography>
        <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
          {underdogTeam}
        </Typography>
        <Typography variant="body2" component="span">
          {` +${line}`}
        </Typography>
      </>
    );
  };

  // Format game status
  const getStatusChip = () => {
    let color = 'primary';
    let label = 'Scheduled';
    
    switch (game.status) {
      case 'in_progress':
        color = 'warning';
        label = 'In Progress';
        break;
      case 'completed':
        color = 'success';
        label = 'Final';
        break;
      case 'postponed':
        color = 'error';
        label = 'Postponed';
        break;
      default:
        break;
    }
    
    return (
      <Chip 
        label={label} 
        color={color} 
        size="small" 
        variant="outlined" 
        sx={{ fontWeight: 500 }}
      />
    );
  };

  return (
    <Box sx={{ p: 1, width: 280 }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ textTransform: 'uppercase' }}>
          {game.sport} • Week {game.week}
        </Typography>
        {getStatusChip()}
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ mb: 1.5 }}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {formattedDate} • {formattedTime}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <PlaceIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {game.venue || 'Venue TBD'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
              <ShowChartIcon fontSize="small" sx={{ mr: 1, mt: 0.3, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Betting Line:</Typography>
                {formatBettingLine()}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {game.status === 'completed' && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Final Score</Typography>
            <Grid container>
              <Grid item xs={8}>
                <Typography variant="body2">
                  {game.awayTeam.name} {game.awayTeam.mascot}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {game.scoreAway !== null ? game.scoreAway : '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={8}>
                <Typography variant="body2">
                  {game.homeTeam.name} {game.homeTeam.mascot}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {game.scoreHome !== null ? game.scoreHome : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </Box>
  );
};

export default GameDetails;