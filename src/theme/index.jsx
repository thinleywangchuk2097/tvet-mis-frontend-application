// src/theme/index.js
import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            background: {
              default: '#f5f5f5',
              paper: '#fff',
            },
            text: {
              primary: '#000',
            },
          }
        : {
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
            text: {
              primary: '#fff',
            },
          }),
    },
  });
