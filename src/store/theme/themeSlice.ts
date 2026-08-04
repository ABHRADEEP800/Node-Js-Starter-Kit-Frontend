import { createSlice } from "@reduxjs/toolkit";
import { getInitialTheme, setValue } from "../../util/localStorage";

const initialState: { pageTheme: string } = {
  pageTheme: getInitialTheme(),
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.pageTheme = action.payload;
      document.querySelector("html")?.classList.remove("light", "dark");
      document.querySelector("html")?.classList.add(action.payload);
      setValue("theme", action.payload);

      // Keep the mobile browser chrome (URL bar) color in sync with the theme.
      document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((meta) =>
          meta.setAttribute(
            "content",
            action.payload === "dark" ? "#030712" : "#f9fafb"
          )
        );
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
