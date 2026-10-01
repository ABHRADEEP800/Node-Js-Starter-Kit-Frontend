export const getValue = (key: string) => {
  return localStorage.getItem(key);
};

export const setValue = (key: string, value: string) => {
  if (!key || !value) return;

  localStorage.setItem(key, value);
};

export const removeValue = (key: string) => {
  localStorage.removeItem(key);
};

/**
 * Returns the theme the app should start with:
 * 1. an explicitly saved theme, or
 * 2. the operating system preference, or
 * 3. "light" as a final fallback.
 */
export const getInitialTheme = (): "light" | "dark" => {
  const saved = getValue("theme");
  if (saved === "dark" || saved === "light") return saved;

  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return "light";
};

/**
 * Apply a theme to the document + persist it. This is a SIDE EFFECT and must
 * NOT run inside a Redux reducer (reducers must be pure and also run on the
 * server, where `document` does not exist). Call it from the event handler that
 * dispatches the `setTheme` action.
 */
export const applyTheme = (theme: "light" | "dark") => {
  if (typeof document === "undefined") return;
  document.querySelector("html")?.classList.remove("light", "dark");
  document.querySelector("html")?.classList.add(theme);
  setValue("theme", theme);
  // Keep the mobile browser chrome (URL bar) color in sync with the theme.
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) =>
    meta.setAttribute("content", theme === "dark" ? "#030712" : "#f9fafb")
  );
};
