import { createSlice } from "@reduxjs/toolkit";
import { getInitialTheme } from "../../util/localStorage";

const initialState: { pageTheme: string } = {
  pageTheme: getInitialTheme(),
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    // Pure reducer: only updates state. The DOM/localStorage side effects live
    // in `applyTheme()` (util/localStorage) and are invoked from the dispatcher.
    setTheme: (state, action) => {
      state.pageTheme = action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
