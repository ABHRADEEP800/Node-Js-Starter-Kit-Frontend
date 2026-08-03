import { Link } from "react-router-dom";
import { ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/outline";

function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gray-50 px-4 py-16 dark:bg-gray-950">
      <div className="w-full max-w-md text-center">
        <p className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-7xl font-extrabold text-transparent">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          The page you're looking for doesn't exist or has been moved. Let's
          get you back on track.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-700"
          >
            <HomeIcon className="h-4 w-4" />
            Back home
          </Link>
          <button
            onClick={() => history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
