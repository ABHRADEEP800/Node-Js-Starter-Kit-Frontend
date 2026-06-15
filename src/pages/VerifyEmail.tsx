import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiClient } from "../util/apiClient";
import { toast } from "react-toastify";

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    apiClient(`/user/verify-email?token=${token}`, { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Email verified successfully! You can now log in.");
          toast.success("Email verified successfully");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
          toast.error(data.message || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("An error occurred during verification");
        toast.error("An error occurred");
      });
  }, [token]);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] py-12 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Email Verification
        </h1>

        {status === "loading" && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto my-4"></div>
        )}

        {status === "success" && (
          <div className="text-green-600 dark:text-green-400 mb-6 font-medium">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {message}
          </div>
        )}

        {status === "error" && (
          <div className="text-red-600 dark:text-red-400 mb-6 font-medium">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {message}
          </div>
        )}

        {(status === "success" || status === "error") && (
          <Link
            to="/signin"
            className="inline-block w-full h-10 leading-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition"
          >
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
