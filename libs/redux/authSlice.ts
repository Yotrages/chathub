import { AuthState, User } from "@/types/index";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Add loading state for better UX
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserCredentials: (state, action: PayloadAction<{user: User, token: string}>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
      // Also store in localStorage as backup
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      // Clear localStorage
      localStorage.removeItem('user');
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Add token validation action
    validateTokenStart: (state) => {
      state.isLoading = true;
    },
    
    validateTokenSuccess: (state, action: PayloadAction<{user: User}>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    
    validateTokenFailure: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      localStorage.removeItem('user');
    },
  }
});

export const { 
  setUserCredentials, 
  logout, 
  setLoading,
  validateTokenStart,
  validateTokenSuccess,
  validateTokenFailure
} = authSlice.actions;

export default authSlice.reducer;
