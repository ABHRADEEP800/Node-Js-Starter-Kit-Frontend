import { createSlice } from "@reduxjs/toolkit";
import { removeValue } from "../../util/localStorage";
import type { User } from "../../types";

interface AuthState {
  status: boolean;
  loggedInUser: User | null;
}

const initialState: AuthState = {
  status: false,
  loggedInUser: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.status = true;
      state.loggedInUser = action.payload;

      //   action.payload.token && setValue("auth-token", action.payload.token);
    },
    logout: (state) => {
      state.status = false;
      state.loggedInUser = null;
      removeValue("access-token");
      removeValue("refresh-token");
      //clears cookies too
      document.cookie =
        "device_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    },
  },
});

export type { AuthState };
export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
