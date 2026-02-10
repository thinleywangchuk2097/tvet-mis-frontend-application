import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

// Initialize state from cookies if they exist
const initialState = {
  userName: Cookies.get("username") || null,
  current_role_name: Cookies.get("current_role_name") || null,
};

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setUserProfile: (state, action) => {
      const { username, current_role_name } = action.payload;
      state.userName = username;
      state.current_role_name = current_role_name;
      Cookies.set('username', username);
      Cookies.set('current_role_name', current_role_name);
    },
    // No need for clearUserProfile since authSlice handles logout cleanup
  },
});

export const { setUserProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;