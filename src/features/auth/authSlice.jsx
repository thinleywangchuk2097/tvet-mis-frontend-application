import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
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

const accessToken = Cookies.get('access_token') || '';
const { userId, roles } = getTokenData(accessToken);

const initialState = {
  accessToken,
  refreshToken: Cookies.get('refresh_token') || null,
  userId,
  roles,
  locationId: Cookies.get('locationId') || null,
  current_roleId: Cookies.get('current_roleId') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { access_token, refresh_token, current_role, locationId} = action.payload;
      const { userId, roles } = getTokenData(access_token);
      state.accessToken = access_token;
      state.refreshToken = refresh_token;
      state.userId = userId;
      state.roles = roles;
      state.locationId = locationId;
      state.current_roleId = current_role;

      Cookies.set('access_token', access_token);
      Cookies.set('current_roleId', current_role);
      Cookies.set('locationId', locationId);
      Cookies.set('refresh_token', refresh_token);
    },

    logout: (state) => {
      state.accessToken = '';
      state.refreshToken = '';
      state.userId = '';
      state.roles = [];
      state.locationId = null;

      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('privileges');
      Cookies.remove('username');
      Cookies.remove('current_roleId');
      Cookies.remove('current_role_name');
      Cookies.remove('locationId');

    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
