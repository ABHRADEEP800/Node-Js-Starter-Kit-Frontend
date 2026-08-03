import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ServerStackIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import type { AuthState } from "../../store/auth/authSlice";

const AdminDashboardComponent = () => {
  const { loggedInUser } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const modules = [
    {
      icon: UserGroupIcon,
      title: "User management",
      description:
        "Connect your user directory here — list, search, promote and suspend accounts.",
      accent: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
    },
    {
      icon: ShieldCheckIcon,
      title: "Security oversight",
      description:
        "Monitor 2FA adoption and session activity across your entire user base.",
      accent: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      icon: ServerStackIcon,
      title: "Audit & analytics",
      description:
        "Extend with login events, failed attempts and usage metrics per user.",
      accent: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
    },
    {
      icon: WrenchScrewdriverIcon,
      title: "Site settings",
      description:
        "Tweak application-wide settings like signup policy and security rules.",
      accent: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Admin banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-lg shadow-indigo-600/20 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Cog6ToothIcon className="h-3.5 w-3.5" />
              Admin access
            </div>
            <h2 className="mt-3 text-xl font-bold sm:text-2xl">
              Admin overview
            </h2>
            <p className="mt-1.5 text-sm text-indigo-100">
              Signed in as {loggedInUser?.username ?? "administrator"}. This
              is your starting point for managing the platform.
            </p>
          </div>
          <Link
            to="profile"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
          >
            <UserGroupIcon className="h-4.5 w-4.5" />
            Account settings
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <UserGroupIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total users
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                — <span className="text-xs font-medium text-gray-400">wire up</span>
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Your role
              </p>
              <p className="text-lg font-bold text-gray-900 capitalize dark:text-white">
                Admin
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Security
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                Hardened
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules grid */}
      <h3 className="mt-10 text-base font-semibold text-gray-900 dark:text-white">
        Admin modules
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Scaffold your admin features right here.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modules.map((mod) => (
          <div
            key={mod.title}
            className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-700"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${mod.accent}`}
            >
              <mod.icon className="h-5.5 w-5.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {mod.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {mod.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Coming soon <ArrowRightIcon className="h-3 w-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardComponent;
