import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App.tsx';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6366f1' },
    secondary: { main: '#ec4899' },
    background: { default: '#f5f6fa', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
