import { useId, type JSX } from "react";

// Enhanced Input Component with better styling
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: string;
  label?: string;
  error?: string;
  message?: string;
}

function Input({
  type = "text",
  placeholder = "",
  label,
  error,
  message,
  className = "",
  ...props
}: InputProps): JSX.Element {
  const id = useId();

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        {error && (
          <span className="text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </span>
        )}
        {message && !error && (
          <span className="text-green-600 dark:text-green-400 text-xs">
            {message}
          </span>
        )}
      </div>

      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete="off"
        {...props}
        className={`
          w-full h-10 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
          focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          transition-all duration-200 ease-in-out
          placeholder-gray-500 dark:placeholder-gray-400
          ${
            error
              ? "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
              : ""
          }
          ${className}
        `}
      />
    </div>
  );
}

export default Input;
