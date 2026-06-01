import { createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

const getTokenData = (token) => {
  try {
    const decoded = jwtDecode(token);
    return {
      userId: decoded.username || '',
      roles: decoded.roles || [],
    };
  } catch (error) {
    return {
      userId: '',
      roles: [],
    };
  }
};

// Helper functions to manage localStorage
const getFromLocalStorage = (key, defaultValue = '') => {
  const value = localStorage.getItem(key);
  return value !== null ? value : defaultValue;
};

const accessToken = getFromLocalStorage('access_token');
const { userId, roles } = getTokenData(accessToken);

const initialState = {
  accessToken,
  refreshToken: getFromLocalStorage('refresh_token', null),
  userId,
  roles,
  id: getFromLocalStorage('id', null),
  locationId: getFromLocalStorage('locationId', null),
  current_roleId: getFromLocalStorage('current_roleId', null),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { access_token, refresh_token, current_role, locationId, id } = action.payload;
      const { userId, roles } = getTokenData(access_token);
      
      state.accessToken = access_token;
      state.refreshToken = refresh_token;
      state.userId = userId;
      state.roles = roles;
      state.locationId = locationId;
      state.current_roleId = current_role;
      state.id = id;

      // Store in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('current_roleId', current_role);
      localStorage.setItem('locationId', locationId);
      localStorage.setItem('id', id);
    },

    logout: (state) => {
      state.accessToken = '';
      state.refreshToken = '';
      state.userId = '';
      state.roles = [];
      state.locationId = null;
      state.current_roleId = null;
      state.id = null;

      // Remove from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('privileges'); 
      localStorage.removeItem('username');
      localStorage.removeItem('current_roleId');
      localStorage.removeItem('current_role_name');
      localStorage.removeItem('locationId');
      localStorage.removeItem('id');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;