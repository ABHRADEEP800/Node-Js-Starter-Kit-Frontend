import { useDispatch, useSelector } from "react-redux";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { setTheme } from "../../store/theme/themeSlice";

export default function ThemeToggler() {
  const themeMode: string = useSelector(
    (state: { theme: { pageTheme: string } }) => state.theme.pageTheme
  );

  const dispatch = useDispatch();

  const themeChangeHandle = (isLight: boolean) => {
    if (isLight) {
      dispatch(setTheme("dark"));
    } else {
      dispatch(setTheme("light"));
    }
  };
  useEffect(() => {
    dispatch(setTheme(themeMode));
  }, [themeMode, dispatch]);

  return (
    <div className="ms-4 flex justify-center items-center ">
      <button
        className="mx-3 cursor-pointer p-0.5 "
        onClick={() => {
          themeChangeHandle(themeMode === "light");
        }}
      >
        {themeMode === "dark" ? (
          <SunIcon
            className="h-6 w-6  dark:text-gray-100  hover:text-colorbs"
            title="Lightmode"
          />
        ) : (
          <MoonIcon
            className="h-5 w-5 text-colorWhite dark:text-gray-100 hover:text-colorbs"
            title="Darkmode"
          />
        )}
      </button>
    </div>
  );
}
