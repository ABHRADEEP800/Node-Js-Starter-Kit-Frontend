interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
}

function Loading({
  fullScreen = true,
  message = "Loading...",
}: LoadingProps) {
  return (
    <div
      className={`${
        fullScreen
          ? "fixed inset-0 z-50 bg-white dark:bg-gray-950"
          : "w-full min-h-[200px]"
      } flex flex-col items-center justify-center p-4 transition-colors duration-300`}
    >
      <div className="flex flex-col items-center justify-center text-center max-w-xs">
        {/* Minimalist premium spinner */}
        <div className="relative w-10 h-10">
          <div className="w-full h-full rounded-full border-2 border-gray-100 dark:border-gray-800" />
          <div className="absolute inset-0 w-full h-full rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-500 animate-spin" />
        </div>

        {/* Message */}
        {message && (
          <p className="mt-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Loading;
