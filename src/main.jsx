import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider, useSelector } from 'react-redux';
import { store } from './store';
import { getTheme } from './theme/index';
import { CssBaseline, ThemeProvider } from '@mui/material';

const ThemedApp = () => {
  const mode = useSelector((state) => state.theme.mode);
  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <ThemedApp />
  </Provider>
);