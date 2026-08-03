import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { AuthState } from "../../store/auth/authSlice";
import userService from "../../services/userService";

const DashboardComponent = () => {
  const { loggedInUser } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    userService
      .get2fastatus()
      .then((res) => setTwoFAEnabled(res.data.twofaEnabled === true))
      .catch(() => setTwoFAEnabled(null));
  }, []);

  const memberSince = loggedInUser?.createdAt
    ? new Date(loggedInUser.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      })
    : "—";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 p-6 text-white shadow-lg shadow-brand-600/20 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Welcome back, {loggedInUser?.fullName?.split(" ")[0] || "friend"}
            </h2>
            <p className="mt-1.5 text-sm text-brand-100">
              Your account is healthy and protected. Here's what's happening.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="profile"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/25"
            >
              <UserCircleIcon className="h-4.5 w-4.5" />
              View profile
            </Link>
            <Link
              to="security"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              <ShieldCheckIcon className="h-4.5 w-4.5" />
              Security
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Account status
              </p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                Verified & active
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                twoFAEnabled
                  ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
              }`}
            >
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Two-factor auth
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {twoFAEnabled === null
                  ? "…"
                  : twoFAEnabled
                    ? "Enabled"
                    : "Not enabled"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <UserCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Role
              </p>
              <p className="text-sm font-semibold text-gray-900 capitalize dark:text-white">
                {loggedInUser?.role ?? "user"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Member since
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {memberSince}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions + security status */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Quick actions
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account from here.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              to="profile"
              className="group rounded-xl border border-gray-200 p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-gray-700 dark:hover:border-brand-700"
            >
              <UserCircleIcon className="h-7 w-7 text-brand-600 dark:text-brand-400" />
              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                Edit profile
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Update your name and contact details.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                Go <ArrowRightIcon className="h-3 w-3" />
              </span>
            </Link>

            <Link
              to="security"
              className="group rounded-xl border border-gray-200 p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-gray-700 dark:hover:border-brand-700"
            >
              <KeyIcon className="h-7 w-7 text-brand-600 dark:text-brand-400" />
              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                Change password
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Keep your account locked down.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                Go <ArrowRightIcon className="h-3 w-3" />
              </span>
            </Link>

            <Link
              to="security"
              className="group rounded-xl border border-gray-200 p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-gray-700 dark:hover:border-brand-700"
            >
              <DevicePhoneMobileIcon className="h-7 w-7 text-brand-600 dark:text-brand-400" />
              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                Manage sessions
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                See where you're logged in.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                Go <ArrowRightIcon className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>

        {/* 2FA security status card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Security status
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            A quick health check of your account.
          </p>

          <div className="mt-6 space-y-4">
            <div
              className={`flex items-center gap-3 rounded-xl border p-4 ${
                twoFAEnabled
                  ? "border-green-200 bg-green-50/60 dark:border-green-900 dark:bg-green-950/40"
                  : "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/40"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  twoFAEnabled
                    ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
                }`}
              >
                {twoFAEnabled ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {twoFAEnabled ? "Fully protected" : "Add 2FA to stay safe"}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {twoFAEnabled
                    ? "Two-factor authentication is on."
                    : "Enable it in Security settings."}
                </p>
              </div>
            </div>

            <Link
              to="security"
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <ShieldCheckIcon className="h-4.5 w-4.5" />
              Manage security
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardComponent;
