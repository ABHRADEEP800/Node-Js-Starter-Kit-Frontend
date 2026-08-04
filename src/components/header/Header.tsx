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

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const projectName = import.meta.env.VITE_PROJECT_NAME as string;

function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-sm shadow-brand-500/30 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]">
        <path
          d="M12 2.5 20 6v5.5c0 4.5-3.4 7.9-8 10-4.6-2.1-8-5.5-8-10V6l8-3.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m8.5 12 2.4 2.4 4.6-4.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
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

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation items for non-authenticated users
  const publicNavItems = [
    { name: "Home", url: "/", auth: true, end: true },
    { name: "Features", url: "#features", auth: true },
    { name: "About", url: "#about", auth: true },
  ];

  // Navigation items for authenticated users
  const privateNavItems = [
    { name: "Dashboard", url: "/dashboard", auth: status, end: true },
  ];

  const adminNavItems = [
    { name: "Dashboard", url: "/admin-dashboard", auth: status, end: true },
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

  const navItems = status
    ? loggedInUser?.role === "admin"
      ? adminNavItems
      : privateNavItems
    : publicNavItems;

  const renderLink = (
    item: { name: string; url: string; end?: boolean; auth?: boolean },
    close: () => void,
    mobile = false
  ) => {
    const baseClasses = classNames(
      mobile ? "block py-2.5 px-3 rounded-lg" : "px-3 py-2 rounded-lg",
      "text-sm font-medium transition-colors"
    );
    const activeClasses =
      "text-brand-600 bg-brand-50 dark:bg-brand-950/50 dark:text-brand-400";
    const idleClasses =
      "text-gray-700 dark:text-gray-300 hover:text-brand-600 hover:bg-gray-100/70 dark:hover:text-brand-400 dark:hover:bg-gray-800/70";

    if (item.url.startsWith("#")) {
      return (
        <button
          key={item.name}
          onClick={() => handleAnchorClick(item.url, close)}
          className={classNames(baseClasses, idleClasses, mobile && "w-full text-left")}
        >
          {item.name}
        </button>
      );
    }

    return (
      <NavLink
        key={item.name}
        to={item.url}
        end={item.end}
        onClick={mobile ? close : undefined}
        className={({ isActive }) =>
          classNames(baseClasses, isActive ? activeClasses : idleClasses)
        }
      >
        {item.name}
      </NavLink>
    );
  };

  return (
    <Disclosure
      as="nav"
      className={classNames(
        "sticky top-0 z-50 border-b transition-all duration-300",
        isScrolled
          ? "border-gray-200 bg-white/85 shadow-sm backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/85"
          : "border-transparent bg-white dark:bg-gray-950"
      )}
    >
      {({ open, close }: { open: boolean; close: () => void }) => (
        <>
          <div className="mx-auto h-16 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-full items-center justify-between gap-3">
              {/* Left: mobile menu button */}
              <div className="flex items-center lg:hidden">
                <DisclosureButton className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-brand-600">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </DisclosureButton>
              </div>

              {/* Logo */}
              <div className="flex flex-1 items-center lg:flex-none">
                <Link
                  to={
                    status
                      ? loggedInUser?.role === "admin"
                        ? "/admin-dashboard"
                        : "/dashboard"
                      : "/"
                  }
                  className="flex items-center gap-2.5"
                >
                  <LogoMark />
                  <span className="hidden text-base font-bold tracking-tight text-gray-900 sm:inline dark:text-white">
                    {projectName}
                  </span>
                </Link>
              </div>

              {/* Desktop nav */}
              <div className="hidden items-center gap-1 lg:flex">
                {navItems.map((item) => renderLink(item, close))}
              </div>

              {/* Right actions */}
              <div className="flex flex-none items-center justify-end gap-1 lg:flex-none">
                <ThemeToggler />
                {status ? (
                  <UserMenu
                    userName={loggedInUser?.username}
                    role={loggedInUser?.role || "user"}
                  />
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      to="/signin"
                      className={classNames(
                        "whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold transition-all sm:px-4",
                        location.pathname === "/signin"
                          ? "hidden"
                          : "text-gray-700 hover:text-brand-600 dark:text-gray-200 dark:hover:text-brand-400"
                      )}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className={classNames(
                        "whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] sm:px-4",
                        location.pathname === "/signup"
                          ? "hidden"
                          : "bg-brand-600 text-white shadow-brand-600/25 hover:bg-brand-700"
                      )}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile panel */}
          <DisclosurePanel className="border-t border-gray-200 bg-white/95 backdrop-blur-xl lg:hidden dark:border-gray-800 dark:bg-gray-950/95">
            <div className="space-y-1 px-3 py-3">
              {navItems.map((item) => renderLink(item, close, true))}
              {!status && (
                <div className="mt-3 flex gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                  <Link
                    to="/signin"
                    onClick={close}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={close}
                    className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

export default Header;
