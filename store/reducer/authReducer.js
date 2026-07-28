import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  auth: null,
};

const authSlice = createSlice({
  name: "authStore",
  initialState,
  reducers: {
    login: (state, action) => {
      state.auth = action.payload;
    },
    logout: (state) => {
      state.auth = null;
    },
    updateProfileData: (state, action) => {
      if (state.auth) {
        state.auth = { ...state.auth, ...action.payload };
      }
    },
  },
});

export const { login, logout, updateProfileData } = authSlice.actions;
export default authSlice.reducer;