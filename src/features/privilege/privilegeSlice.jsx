import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function to load from cookies
const loadPrivilegesFromCookies = () => {
  try {
    const savedPrivileges = Cookies.get('privileges');
    return savedPrivileges ? JSON.parse(savedPrivileges) : [];
  } catch (error) {
    console.error("Failed to parse privileges from cookies:", error);
    return [];
  }
};

// Initialize state from cookies
const initialState = {
  privileges: loadPrivilegesFromCookies(),
};

const privilegeSlice = createSlice({
  name: 'privileges',
  initialState,
  reducers: {
    setPrivileges: (state, action) => {
      const privileges = Array.isArray(action.payload) ? action.payload : [];
      state.privileges = privileges;
      // Store in cookies with 1 day expiration
      Cookies.set('privileges', JSON.stringify(privileges), { 
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    },
    reSetPrivileges: (state) => {
      state.privileges = [];
      Cookies.remove('privileges');
    },
  },
});

export const { setPrivileges, reSetPrivileges } = privilegeSlice.actions;

// Selector to get privileges
export const selectPrivileges = (state) => state.privileges.privileges || [];

export default privilegeSlice.reducer;