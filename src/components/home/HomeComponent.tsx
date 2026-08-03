import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  MoonIcon,
  BoltIcon,
  SparklesIcon,
  UserGroupIcon,
  FingerPrintIcon,
  CheckBadgeIcon,
  RocketLaunchIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import type { AuthState } from "../../store/auth/authSlice";

const features = [
  {
    icon: ShieldCheckIcon,
    title: "Secure Authentication",
    description:
      "Production-ready sign in & registration with bcrypt hashing, JWT tokens, rate limiting and Helmet security headers baked in.",
  },
  {
    icon: FingerPrintIcon,
    title: "Two-Factor Authentication",
    description:
      "TOTP-based 2FA with QR setup, backup codes and a 6-digit verification flow your users already expect.",
  },
  {
    icon: KeyIcon,
    title: "Password Recovery",
    description:
      "Forgot password & reset flows with signed tokens, email delivery and automatic session termination on reset.",
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Session Management",
    description:
      "Track every active session, see device & IP details, and revoke devices remotely with one click.",
  },
  {
    icon: UserGroupIcon,
    title: "Role-Based Access",
    description:
      "User & admin dashboards protected by route guards, with role-aware navigation and UI out of the box.",
  },
  {
    icon: MoonIcon,
    title: "Dark Mode",
    description:
      "Polished light & dark themes persisted to localStorage with a single click toggle — no flicker on load.",
  },
];

const dashboardFeatures = [
  {
    icon: BoltIcon,
    title: "Modern Stack",
    description: "React 19, Vite, TypeScript, Redux Toolkit & Tailwind CSS v4.",
  },
  {
    icon: SparklesIcon,
    title: "Zero Design Debt",
    description:
      "Consistent spacing, a unified blue accent palette and reusable Button/Input/Container primitives.",
  },
  {
    icon: CheckBadgeIcon,
    title: "Email Verification",
    description:
      "Verified emails with signed links, availability checks and recaptcha-protected forms.",
  },
  {
    icon: RocketLaunchIcon,
    title: "PWA Ready",
    description:
      "Service worker registration and installable build output included out of the box.",
  },
];

function HomeComponent() {
  const { status, loggedInUser }: AuthState = useSelector(
    (state: { auth: AuthState }) => state.auth
  );
  const location = useLocation();

  // Handle anchor navigation coming from the header (e.g. Features / About)
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!target) return;

    // Wait a tick so the page has rendered before scrolling
    const t = setTimeout(() => {
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    return () => clearTimeout(t);
  }, [location.state]);

  const primaryHref = status
    ? loggedInUser?.role === "admin"
      ? "/admin-dashboard"
      : "/dashboard"
    : "/signin";
  const primaryLabel = status
    ? "Open your dashboard"
    : "Get started free";

  return (
    <div className="relative overflow-x-clip">
      {/* ---------- HERO ---------- */}
      <section className="relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl dark:bg-brand-500/10" />
          <div className="absolute top-24 -left-40 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="absolute top-40 -right-40 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300">
              <SparklesIcon className="h-4 w-4" />
              Production-ready auth starter
            </div>

            <h1 className="animate-fade-in-up mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
              Ship your next app{" "}
              <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
                faster than ever
              </span>
            </h1>

            <p className="animate-fade-in-up mt-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              {import.meta.env.VITE_PROJECT_NAME} gives you a complete,
              secure and beautiful starting point — authentication, 2FA,
              sessions, role-based dashboards and a polished UI, so you can
              focus on building what matters.
            </p>

            <div className="animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to={primaryHref}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-brand-700/25 active:scale-[0.98] sm:w-auto"
              >
                {primaryLabel}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => {
                  document
                    .querySelector("#features")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white/60 px-6 py-3.5 text-sm font-semibold text-gray-700 backdrop-blur transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-auto"
              >
                Explore features
              </button>
            </div>

            <div className="animate-fade-in mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                JWT + refresh tokens
              </span>
              <span className="flex items-center gap-1.5">
                <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                2FA with backup codes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                Rate limiting
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Everything you need,{" "}
              <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
                already wired up
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
              Stop re-building auth, sessions and UI scaffolding for every
              project. This starter kit ships with the hard parts done.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-800"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950 dark:text-brand-400">
                  <feature.icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ABOUT / STACK ---------- */}
      <section id="about" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                  Built for developers who{" "}
                  <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
                    care about quality
                  </span>
                </h2>
                <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
                  A thoughtfully structured codebase with typed API clients,
                  clean folder conventions and components that are ready to
                  extend. Clone it, rename it, ship it.
                </p>
                <ul className="mt-8 space-y-4">
                  {dashboardFeatures.map((item) => (
                    <li key={item.title} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative hidden items-center justify-center border-l border-gray-200 bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-12 lg:flex dark:border-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
                <div className="animate-float w-full max-w-sm rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-2xl shadow-brand-500/10 backdrop-blur dark:border-gray-700 dark:bg-gray-800/90">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 text-sm font-bold text-white">
                      S
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Welcome back, developer
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Online · 2FA protected
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {[
                      { label: "Auth flow", value: "Complete" },
                      { label: "Session control", value: "Active" },
                      { label: "UI polish", value: "Shipped" },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <span className="text-gray-600 dark:text-gray-400">
                          {row.label}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white">
                    <CodeBracketIcon className="h-4 w-4" />
                    Start building
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-700 px-6 py-16 text-center shadow-2xl shadow-brand-600/30 sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
            />
            <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to start your next project?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base text-brand-100">
              Jump straight into a secure, polished codebase. All the boring
              parts are done — go build something people love.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to={primaryHref}
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50 active:scale-[0.98]"
              >
                {status ? "Go to dashboard" : "Create your account"}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomeComponent;
