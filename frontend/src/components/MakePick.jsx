import React, { useState } from 'react';
import { 
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Tooltip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Paper,
  Grid,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import SportsHockeyIcon from '@mui/icons-material/SportsHockey';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { format } from 'date-fns';
import apiService from '../services/apiService';

const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  marginBottom: theme.spacing(2),
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const GameStatusChip = styled(Chip)(({ theme, status }) => {
  let color = theme.palette.info.main;
  if (status === 'completed') color = theme.palette.success.main;
  if (status === 'in_progress') color = theme.palette.warning.main;
  if (status === 'postponed') color = theme.palette.error.main;
  
  return {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    color: '#fff',
    backgroundColor: color,
  };
});

const SportIconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  marginRight: theme.spacing(1),
}));

// Helper function to get sport icon
const getSportIcon = (sport) => {
  switch (sport.toLowerCase()) {
    case 'football': return <SportsFootballIcon />;
    case 'soccer': return <SportsSoccerIcon />;
    case 'basketball': return <SportsBasketballIcon />;
    case 'baseball': return <SportsBaseballIcon />;
    case 'hockey': return <SportsHockeyIcon />;
    default: return <SportsFootballIcon />;
  }
};

const MakePick = ({ game, existingPick, onPickSaved, leagueHasTiebreaker }) => {
  const [selectedTeam, setSelectedTeam] = useState(existingPick?.teamId || '');
  const [tiebreaker, setTiebreaker] = useState(existingPick?.tiebreaker || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Convert game time to user's local time
  const gameTime = game.gameTime ? new Date(game.gameTime) : null;
  const formattedGameTime = gameTime ? format(gameTime, 'MMM d, yyyy h:mm a') : 'TBD';
  
  // Check if game is in the past
  const isPastGame = gameTime && new Date() > gameTime;
  
  // Check if pick can be edited (only future games)
  const canEdit = !isPastGame && game.status !== 'completed';
  
  // Format the betting line for display
  const getBettingLine = () => {
    if (!game.spreadHome) return 'Even';
    
    const favoredTeam = game.spreadHome < 0 ? game.homeTeam.name : game.awayTeam.name;
    const line = Math.abs(game.spreadHome);
    return `${favoredTeam} -${line}`;
  };
  
  // Game info for tooltip
  const gameInfo = `
    ${formattedGameTime}
    Venue: ${game.venue || 'TBD'}
    Line: ${getBettingLine()}
  `;
  
  const handleSubmitPick = async () => {
    if (!selectedTeam) {
      setErrorMessage('Please select a team');
      return;
    }
    
    if (leagueHasTiebreaker && tiebreaker === '') {
      setErrorMessage('Please enter a tiebreaker value');
      return;
    }
    
    setIsSaving(true);
    setErrorMessage('');
    
    try {
      const pickData = {
        gameId: game.id,
        teamId: selectedTeam,
        tiebreaker: leagueHasTiebreaker ? tiebreaker : null
      };
      
      // If there's an existing pick, update it; otherwise create a new one
      let response;
      if (existingPick?.id) {
        response = await apiService.updatePick(existingPick.id, pickData);
      } else {
        response = await apiService.createPick(pickData);
      }
      
      if (onPickSaved) {
        onPickSaved(response.data);
      }
    } catch (error) {
      console.error('Error saving pick:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to save pick');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Determine if the pick was correct (only applies to completed games)
  const renderPickResult = () => {
    if (!existingPick || game.status !== 'completed') return null;
    
    const isCorrect = existingPick.isCorrect;
    return (
      <Box mt={1} display="flex" justifyContent="center">
        <Chip 
          label={isCorrect ? 'Correct Pick' : 'Incorrect Pick'} 
          color={isCorrect ? 'success' : 'error'} 
          variant="outlined"
        />
      </Box>
    );
  };

  return (
    <StyledCard>
      {game.status && (
        <GameStatusChip 
          label={game.status.replace('_', ' ')} 
          status={game.status}
          size="small"
        />
      )}
      
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <SportIconContainer>
            {getSportIcon(game.sport)}
          </SportIconContainer>
          <Typography variant="subtitle2" color="textSecondary">
            {game.sport} • Week {game.week}
            <Tooltip title={gameInfo} arrow placement="top">
              <InfoOutlinedIcon fontSize="small" sx={{ ml: 1, cursor: 'pointer', fontSize: '1rem' }} />
            </Tooltip>
          </Typography>
        </Box>
        
        <Box mb={2}>
          <Typography variant="body2" color="textSecondary" align="center">
            {formattedGameTime}
          </Typography>
        </Box>
        
        <FormControl component="fieldset" fullWidth disabled={!canEdit}>
          <RadioGroup
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <Paper variant="outlined" sx={{ mb: 1, p: 1 }}>
              <Grid container alignItems="center">
                <Grid item xs={8}>
                  <FormControlLabel
                    value={game.awayTeam.id}
                    control={<Radio />}
                    label={
                      <Typography variant="body1">
                        {game.awayTeam.name} {game.awayTeam.mascot}
                      </Typography>
                    }
                  />
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" align="right">
                    {game.scoreAway !== null ? game.scoreAway : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Box textAlign="center" my={0.5}>
              <Typography variant="body2" color="textSecondary">
                VS
              </Typography>
            </Box>
            
            <Paper variant="outlined" sx={{ mt: 1, p: 1 }}>
              <Grid container alignItems="center">
                <Grid item xs={8}>
                  <FormControlLabel
                    value={game.homeTeam.id}
                    control={<Radio />}
                    label={
                      <Typography variant="body1">
                        {game.homeTeam.name} {game.homeTeam.mascot}
                      </Typography>
                    }
                  />
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" align="right">
                    {game.scoreHome !== null ? game.scoreHome : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </RadioGroup>
        </FormControl>
        
        {leagueHasTiebreaker && (
          <Box mt={2}>
            <TextField
              label="Tiebreaker (Total Points)"
              variant="outlined"
              fullWidth
              type="number"
              value={tiebreaker}
              onChange={(e) => setTiebreaker(e.target.value)}
              disabled={!canEdit}
              size="small"
              inputProps={{ min: 0 }}
              helperText="Predict the total combined score"
            />
          </Box>
        )}
        
        {renderPickResult()}
        
        {errorMessage && (
          <Typography color="error" variant="body2" align="center" mt={1}>
            {errorMessage}
          </Typography>
        )}
        
        {canEdit && (
          <Box mt={2} textAlign="center">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitPick}
              disabled={isSaving}
              size="small"
            >
              {existingPick?.id ? 'Update Pick' : 'Submit Pick'}
            </Button>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default MakePick;