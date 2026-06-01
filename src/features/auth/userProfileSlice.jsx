import { createSlice } from "@reduxjs/toolkit";

// Helper function to get from localStorage
const getFromLocalStorage = (key, defaultValue = null) => {
  const value = localStorage.getItem(key);
  return value !== null ? value : defaultValue;
};

// Initialize state from localStorage if they exist
const initialState = {
  userName: getFromLocalStorage("username"),
  current_role_name: getFromLocalStorage("current_role_name"),
};

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setUserProfile: (state, action) => {
      const { username, current_role_name } = action.payload;
      state.userName = username;
      state.current_role_name = current_role_name;
      
      // Store in localStorage
      localStorage.setItem('username', username);
      localStorage.setItem('current_role_name', current_role_name);
    },
    // No need for clearUserProfile since authSlice handles logout cleanup
  },
});

export const { setUserProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;