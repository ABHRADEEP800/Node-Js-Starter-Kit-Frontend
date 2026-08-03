import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import type { AuthState } from "../../store/auth/authSlice";

const tabs = [
  { name: "Overview", to: "", end: true, icon: HomeIcon },
  { name: "Profile", to: "profile", end: false, icon: UserCircleIcon },
  { name: "Security", to: "security", end: false, icon: ShieldCheckIcon },
];

function DashboardContainer() {
  const { loggedInUser } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin-dashboard");
  const basePath = isAdmin ? "/admin-dashboard" : "/dashboard";
  const isOverview = location.pathname === basePath;

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-950">
      {/* Page heading */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {isAdmin ? "Admin Console" : "Dashboard"}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isOverview
                ? `${greeting}, ${loggedInUser?.username ?? "there"}`
                : isAdmin
                  ? "Admin Console"
                  : "Dashboard"}
            </h1>
          </div>

          {/* Sub navigation */}
          <nav className="mt-5 -mb-px flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                      : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-100"
                  }`
                }
              >
                <tab.icon className="h-4.5 w-4.5" />
                {tab.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <Outlet />
    </div>
  );
}

export default DashboardContainer;
