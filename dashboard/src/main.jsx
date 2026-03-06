import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import './styles.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1CABE2' },
    secondary: { main: '#374EA2' },
    warning: { main: '#FFC20E' },
    success: { main: '#23A26D' },
    background: { default: '#F5FBFF', paper: '#FFFFFF' },
    text: { primary: '#1D1D1B', secondary: '#6B6E72' }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
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
