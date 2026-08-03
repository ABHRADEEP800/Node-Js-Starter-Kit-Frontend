import { Link } from "react-router-dom";
import { HeartIcon } from "@heroicons/react/24/solid";

const projectName = import.meta.env.VITE_PROJECT_NAME as string;

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 text-sm font-bold text-white">
              {projectName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {projectName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Secure by default · Beautiful by design
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
            <Link
              to="/"
              className="transition-colors hover:text-brand-600 dark:hover:text-brand-400"
            >
              Home
            </Link>
            <a
              href="#features"
              className="transition-colors hover:text-brand-600 dark:hover:text-brand-400"
            >
              Features
            </a>
            <a
              href="#about"
              className="transition-colors hover:text-brand-600 dark:hover:text-brand-400"
            >
              About
            </a>
            <Link
              to="/signin"
              className="transition-colors hover:text-brand-600 dark:hover:text-brand-400"
            >
              Sign in
            </Link>
          </nav>

          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            © {year} {projectName} · Built with
            <HeartIcon className="h-3.5 w-3.5 text-red-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
