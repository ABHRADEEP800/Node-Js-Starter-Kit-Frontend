import { useDispatch, useSelector } from "react-redux";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { setTheme } from "../../store/theme/themeSlice";

export default function ThemeToggler() {
  const themeMode: string = useSelector(
    (state: { theme: { pageTheme: string } }) => state.theme.pageTheme
  );

  const dispatch = useDispatch();

  const isDark = themeMode === "dark";

  const toggleTheme = () => {
    dispatch(setTheme(isDark ? "light" : "dark"));
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <span className="flex items-center justify-center transition-transform duration-300 ease-out">
        {isDark ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </span>
    </button>
  );
}
