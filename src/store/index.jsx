// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import themeReducer from '../features/theme/themeSlice';
import authReducer from '../features/auth/authSlice'; 
import authPrivilegeReducer from '../features/privilege/privilegeSlice'
import UserProfileReducer from '../features/auth/userProfileSlice'

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer, //add auth reducer
    privileges: authPrivilegeReducer,
    userProfile: UserProfileReducer

  },
});
