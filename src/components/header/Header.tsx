import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  Disclosure,
  DisclosurePanel,
  DisclosureButton,
} from "@headlessui/react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import UserMenu from "./UserMenu";
import type { AuthState } from "../../store/auth/authSlice";
import ThemeToggler from "./ThemeToggler";
import { useState, useEffect } from "react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function Header() {
  const { status, loggedInUser }: AuthState = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation items for non-authenticated users
  // Added 'end: true' to Home so it doesn't highlight on every page
  const publicNavItems = [
    { name: "Home", url: "/", auth: true, end: true }, 
    { name: "Features", url: "#features", auth: true },
    { name: "About", url: "#about", auth: true },
  ];

  // Navigation items for authenticated users
  // Added 'end: true' to Dashboards so they don't highlight when on sub-pages (e.g. Users)
  const privateNavItems = [
    { name: "Dashboard", url: "/dashboard", auth: status, end: true },
  ];
  
  const adminNavItems = [
    { name: "Dashboard", url: "/admin-dashboard", auth: status, end: true },
    // Example: If you add Users later, you can leave end: false to keep it active on sub-pages
    // { name: "Users", url: "/admin-dashboard/users", auth: status, end: false },
  ];

  // Function to handle anchor link clicks
  const handleAnchorClick = (url: string, close: () => void) => {
    if (url.startsWith("#")) {
      if (location.pathname !== "/") {
        navigate("/", { state: { scrollTo: url } });
      } else {
        const section = document.querySelector(url);
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }
      close();
    }
  };

  return (
    <Disclosure
      as="nav"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm"
          : "bg-white dark:bg-gray-900 border-b border-transparent"
      }`}
    >
      {({ open, close }: { open: boolean; close: () => void }) => (
        <>
          {/* HEADER */}
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left - Mobile Menu Toggle */}
              <div className="flex items-center md:hidden">
                <DisclosureButton className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none">
                  {open ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </DisclosureButton>
              </div>

              {/* Center - Logo */}
              <div className="flex justify-center md:justify-start flex-1 md:flex-none">
                <Link
                  to={
                    status
                      ? loggedInUser?.role === "admin"
                        ? "/admin-dashboard"
                        : "/dashboard"
                      : "/"
                  }
                  className="flex items-center"
                >
                  <img
                    src="/NovaShield.svg"
                    alt={import.meta.env.VITE_PROJECT_NAME}
                    className="h-7 w-7 mr-2"
                  />
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {import.meta.env.VITE_PROJECT_NAME}
                  </span>
                </Link>
              </div>

              {/* Right - UserMenu / Login */}
              <div className="flex items-center md:hidden">
                <ThemeToggler />
                {status ? (
                  <UserMenu
                    userName={loggedInUser?.username}
                    role={loggedInUser?.role || "user"}
                  />
                ) : (
                  <>
                    {location.pathname === "/signin" ? (
                      <Link
                        to="/signup"
                        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                      >
                        Sign Up
                      </Link>
                    ) : (
                      <Link
                        to="/signin"
                        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                      >
                        Log In
                      </Link>
                    )}
                  </>
                )}
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex md:items-center md:space-x-6">
                {status
                  ? // Authenticated user navigation
                    (loggedInUser?.role === "admin"
                      ? adminNavItems
                      : privateNavItems
                    ).map(
                      (item) =>
                        item.auth && (
                          <NavLink
                            key={item.name}
                            to={item.url}
                            end={item.end} // Use the 'end' prop here
                            className={({ isActive }) => classNames(
                              "text-sm font-semibold px-3 py-2 rounded-md transition-colors",
                              isActive
                                ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                            )}
                          >
                            {item.name}
                          </NavLink>
                        )
                    )
                  : // Public navigation
                    publicNavItems.map(
                      (item) =>
                        item.auth && (
                          <div key={item.name}>
                            {item.url.startsWith("#") ? (
                              <button
                                onClick={() => handleAnchorClick(item.url, close)}
                                className="text-sm font-semibold px-3 py-2 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {item.name}
                              </button>
                            ) : (
                              <NavLink
                                to={item.url}
                                end={item.end} // Use the 'end' prop here
                                className={({ isActive }) => classNames(
                                  "text-sm font-semibold px-3 py-2 rounded-md transition-colors",
                                  isActive
                                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                )}
                              >
                                {item.name}
                              </NavLink>
                            )}
                          </div>
                        )
                    )}
              </div>

              {/* Desktop Right */}
              <div className="hidden md:flex md:items-center md:space-x-4">
                <ThemeToggler />
                {status ? (
                  <UserMenu
                    userName={loggedInUser?.username}
                    role={loggedInUser?.role || "user"}
                  />
                ) : (
                  <>
                    {location.pathname === "/signin" ? (
                      <Link
                        to="/signup"
                        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                      >
                        Sign Up
                      </Link>
                    ) : (
                      <Link
                        to="/signin"
                        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                      >
                        Log In
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Nav Panel */}
          <DisclosurePanel className="md:hidden absolute top-16 left-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-50 shadow-md px-4 pb-3 space-y-1">
            {status
              ? // Authenticated user mobile navigation
                (loggedInUser?.role === "admin"
                  ? adminNavItems
                  : privateNavItems
                ).map(
                  (item) =>
                    item.auth && (
                      <NavLink
                        onClick={close}
                        key={item.name}
                        to={item.url}
                        end={item.end} // Use the 'end' prop here
                        className={({ isActive }) => classNames(
                          "block text-sm font-medium py-2 px-3 rounded-md",
                          isActive
                            ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        {item.name}
                      </NavLink>
                    )
                )
              : // Public mobile navigation
                publicNavItems.map(
                  (item) =>
                    item.auth && (
                      <div key={item.name}>
                        {item.url.startsWith("#") ? (
                          <button
                            onClick={() => handleAnchorClick(item.url, close)}
                            className="block text-sm font-medium py-2 px-3 rounded-md w-full text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {item.name}
                          </button>
                        ) : (
                          <NavLink
                            onClick={close}
                            to={item.url}
                            end={item.end} // Use the 'end' prop here
                            className={({ isActive }) => classNames(
                              "block text-sm font-medium py-2 px-3 rounded-md",
                              isActive
                                ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            {item.name}
                          </NavLink>
                        )}
                      </div>
                    )
                )}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

export default Header;