import { createSlice } from "@reduxjs/toolkit";

// Helper functions to load/save privileges from localStorage
const loadPrivilegesFromStorage = () => {
  try {
    const savedPrivileges = localStorage.getItem("privileges");
    return savedPrivileges ? JSON.parse(savedPrivileges) : [];
  } catch (error) {
    console.error("Failed to parse privileges from localStorage:", error);
    return [];
  }
};

const savePrivilegesToStorage = (privileges) => {
  try {
    localStorage.setItem("privileges", JSON.stringify(privileges));
  } catch (error) {
    console.error("Failed to save privileges to localStorage:", error);
  }
};

// Initialize state from localStorage
const initialState = {
  privileges: loadPrivilegesFromStorage(),
};

const privilegeSlice = createSlice({
  name: "privileges",
  initialState,
  reducers: {
    setPrivileges: (state, action) => {
      const privileges = Array.isArray(action.payload) ? action.payload : [];
      console.log("Setting privileges in Redux state:", privileges);
      state.privileges = privileges;
      savePrivilegesToStorage(privileges); // Persist in localStorage
    },
    reSetPrivileges: (state) => {
      state.privileges = [];
      localStorage.removeItem("privileges"); // Clear localStorage on logout
    },
  },
});

export const { setPrivileges, reSetPrivileges } = privilegeSlice.actions;

// Selector to get privileges
export const selectPrivileges = (state) => state.privileges.privileges || [];

export default privilegeSlice.reducer;
