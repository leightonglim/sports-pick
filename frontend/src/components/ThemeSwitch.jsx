import React, { useContext } from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Theme toggle switch component
 * Can be placed in the header/app bar of your application
 */
const ThemeSwitch = () => {
  const theme = useTheme();
  const { themeMode } = useContext(AuthContext);
  const { useDarkTheme, toggleTheme } = themeMode || {};
  
  // If theme mode context isn't available, don't render
  if (!toggleTheme) return null;
  
  return (
    <Tooltip title={useDarkTheme ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        aria-label="toggle theme"
        edge="end"
        sx={{ ml: 1 }}
      >
        {useDarkTheme ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeSwitch;