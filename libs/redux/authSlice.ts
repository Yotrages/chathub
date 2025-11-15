import { AuthState, User } from "@/types/index";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PaginationInfo } from "./postSlice";
import { deleteCookie } from "cookies-next";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, 
  background: 'gray-50',
  suggestedUsers: null,
  pagination: null,
};

interface SuggestedUsersResponse {
  success: boolean;
  users: User[];
  pagination: PaginationInfo;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserCredentials: (state, action: PayloadAction<{user: User}>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
    },

    updateUserOnlineStatus: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.online = action.payload
      }
    },

    updateUserCredentials: (state, action: PayloadAction<User>) => {
      console.log("Redux get data", action.payload)
      if (state.user) {
        state.user = {...state.user, ...action.payload}
        console.log("user updated", state.user)
      }
    },
    
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      deleteCookie('auth-token')
    },

    addSuggestedUsers: (state, action: PayloadAction<User[]>) => {
      const newSuggestedUsers = action.payload.filter(suggestedUser => !state.suggestedUsers?.some((user) => user._id === suggestedUser._id))
      state.suggestedUsers?.push(...newSuggestedUsers)
    },

    setSuggestedUsersWithPagination: (state, action: PayloadAction<SuggestedUsersResponse>) => {
      state.suggestedUsers = action.payload.users;
      state.pagination = action.payload.pagination;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
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
      state.isAuthenticated = false;
      state.isLoading = false;
      sessionStorage.removeItem('user');
    },
    setBackground: (state, action: PayloadAction<string>) => {
      state.background = action.payload;
    },
  },
});

export const { 
  setUserCredentials, 
  logout, 
  setLoading,
  validateTokenStart,
  validateTokenSuccess,
  validateTokenFailure,
  setBackground,
  updateUserCredentials,
  setSuggestedUsersWithPagination,
  addSuggestedUsers,
  updateUserOnlineStatus
} = authSlice.actions;

export default authSlice.reducer;
