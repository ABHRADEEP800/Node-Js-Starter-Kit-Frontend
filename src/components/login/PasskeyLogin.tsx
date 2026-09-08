import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../store/auth/authSlice";
import userService from "../../services/userService";
import {
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";
import { getErrorMessage, asApiError, withTimeout } from "../../util/errors";

interface PasskeyLoginProps {
  identifier?: string;
  executeRecaptcha?: (action?: string) => Promise<string>;
  disabled?: boolean;
}

function PasskeyLoginButton({
  identifier = "",
  executeRecaptcha,
  disabled,
}: PasskeyLoginProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  if (!browserSupportsWebAuthn()) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 px-4 rounded-lg font-medium opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2"
      >
        Passkeys are not supported on this device
      </button>
    );
  }

  const handlePasskeyLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!executeRecaptcha) throw new Error("Recaptcha not yet available");

      const token = await withTimeout(
        executeRecaptcha(),
        "reCAPTCHA timed out. Please try again.",
        8000
      );
      if (!token) throw new Error("Recaptcha verification failed");

      const optedIdentifier = identifier.trim();

      const optionsRes = await userService.getPasskeyLoginOptions(
        optedIdentifier,
        token
      );
      const authResponse = await startAuthentication({
        optionsJSON: optionsRes.data,
      });

      const loginRes = await userService.verifyPasskeyLogin(
        authResponse,
        false
      );

      if (loginRes.data.twofaEnabled === true) {
        toast.info("Two-factor authentication is required.");
        navigate("/twofa");
      } else {
        dispatch(login(loginRes.data.user));
        navigate("/");
        toast.success(loginRes.message);
      }
    } catch (err: unknown) {
      const error = asApiError(err);
      if (error?.name === "NotAllowedError") {
        // User cancelled the browser prompt — do nothing.
        return;
      }
      toast.error(getErrorMessage(err, "Passkey login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePasskeyLogin}
      disabled={disabled || isLoading}
      className="w-full py-3 px-4 rounded-lg font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <svg
            className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
          <span>Waiting for passkey…</span>
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5 text-brand-600 dark:text-brand-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>
          Sign in with passkey
        </>
      )}
    </button>
  );
}

export default PasskeyLoginButton;
