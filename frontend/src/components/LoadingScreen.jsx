import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Loading screen component shown during lazy loading of route components
 * Provides visual feedback to users while components are being loaded
 */
const LoadingScreen = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        bgcolor: (theme) => theme.palette.background.default,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography 
        variant="h6" 
        sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}
      >
        Loading...
      </Typography>
    </Box>
  );
};

export default LoadingScreen;