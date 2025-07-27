import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const COLORS = {
  primary: '#FF6B35',
  secondary: '#F7931E',
  accent: '#FFD23F',
  dark: '#2C3E50',
  light: '#ECF0F1',
  white: '#FFFFFF',
  success: '#27AE60',
  danger: '#E74C3C',
  info: '#3498DB',
  warning: '#F39C12'
};

const LIGHT_THEME = {
  colors: {
    ...COLORS,
    background: COLORS.white,
    surface: COLORS.light,
    text: COLORS.dark,
    textSecondary: '#7F8C8D',
    border: '#BDC3C7'
  },
  name: 'light'
};

const DARK_THEME = {
  colors: {
    ...COLORS,
    background: '#1A1A1A',
    surface: '#2C2C2C',
    text: COLORS.white,
    textSecondary: '#BDC3C7',
    border: '#4A4A4A'
  },
  name: 'dark'
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
    colors: theme.colors
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};