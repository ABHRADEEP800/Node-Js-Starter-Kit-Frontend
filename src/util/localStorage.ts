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
