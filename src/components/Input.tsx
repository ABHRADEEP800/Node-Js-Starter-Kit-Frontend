import React, { useId, useState } from "react";
import {
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export type InputStatus = "error" | "success" | "loading";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Shown (red) under the field when present. */
  error?: string;
  /** Accompanying text for `status` — e.g. "Checking…" or "Available". */
  message?: string;
  /**
   * Drives the feedback row & border styling.
   * - "error"   → red border + X icon + `error`/`message` text
   * - "success" → green border + check icon + `message` text
   * - "loading" → brand spinner + `message` text
   */
  status?: InputStatus;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = "text",
      placeholder = "",
      label,
      error,
      message,
      status,
      className = "",
      name,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    // Show the feedback row when there is either an error or a status message.
    const hasError = !!error || status === "error";
    const showLoading = !hasError && status === "loading";
    const feedback = error || message;
    const feedbackId = feedback ? `${id}-feedback` : undefined;

    // Sensible autofill hints so password managers & browser autofill work.
    // An explicit `autoComplete` prop always wins.
    const defaultAutoComplete = () => {
      const lowerName = (name || "").toLowerCase();
      if (isPassword) {
        return /current|old|existing/.test(lowerName)
          ? "current-password"
          : "new-password";
      }
      if (type === "email" || lowerName === "email") return "email";
      if (lowerName === "username" || lowerName === "user") return "username";
      if (lowerName === "fullname" || lowerName === "name") return "name";
      if (lowerName === "cnfpassword") return "new-password";
      return "off";
    };

    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={inputType}
            placeholder={placeholder}
            name={name}
            autoComplete={props.autoComplete ?? defaultAutoComplete()}
            aria-invalid={hasError || undefined}
            aria-describedby={feedbackId}
            {...props}
            className={`
              w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-brand-500 focus:border-transparent
              transition-all duration-200 ease-in-out
              placeholder-gray-500 dark:placeholder-gray-400
              ${isPassword ? "pr-11" : ""}
              ${
                hasError
                  ? "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
                  : status === "success"
                    ? "border-green-500 focus:ring-green-500"
                    : ""
              }
              ${className}
            `}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* Live status / validation feedback */}
        {(feedback || showLoading) && (
          <p
            id={feedbackId}
            role={hasError ? "alert" : "status"}
            className={`mt-1.5 flex items-start gap-1.5 text-xs leading-5 ${
              hasError
                ? "text-red-600 dark:text-red-400"
                : showLoading
                  ? "text-gray-500 dark:text-gray-400"
                  : "text-green-600 dark:text-green-400"
            }`}
          >
            {hasError ? (
              <XCircleIcon
                className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400"
                aria-hidden="true"
              />
            ) : showLoading ? (
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-brand-500"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <CheckCircleIcon
                className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                aria-hidden="true"
              />
            )}
            <span className="min-w-0">{feedback ?? message}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
