import React, { type JSX } from "react";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

function Button({
  children,
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={`
        w-full py-3 px-4 rounded-lg font-medium 
        bg-blue-600 hover:bg-blue-700 text-white 
        dark:bg-blue-500 dark:hover:bg-blue-600 
        transition-all duration-200 ease-in-out
        flex items-center justify-center
        ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-md cursor-pointer"}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
