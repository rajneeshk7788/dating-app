import React, { useEffect, useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();
  const { mode } = useThemeStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#8b5cf6', // Violet
            light: '#a78bfa',
            dark: '#7c3aed',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#ec4899', // Pink / Rose
            light: '#f472b6',
            dark: '#db2777',
            contrastText: '#ffffff',
          },
          background: {
            default: mode === 'dark' ? '#0b0f19' : '#f8fafc',
            paper: mode === 'dark' ? '#111827' : '#ffffff',
          },
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
          h5: { fontFamily: "'Outfit', 'Inter', sans-serif" },
          h6: { fontFamily: "'Outfit', 'Inter', sans-serif" },
        },
        shape: {
          borderRadius: 12,
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
};
