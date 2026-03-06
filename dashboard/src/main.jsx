import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import './styles.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1CABE2' },
    secondary: { main: '#005EB8' },
    warning: { main: '#FFB81C' },
    success: { main: '#23A26D' },
    background: { default: '#F3FAFF', paper: '#FFFFFF' },
    text: { primary: '#0E2A3B', secondary: '#4A6475' }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Public Sans, system-ui, sans-serif',
    h4: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
