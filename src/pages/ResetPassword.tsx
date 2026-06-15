import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Input, Container } from "../components";
import userService from "../services/userService";

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>();

  const password = watch("password");

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error("Invalid or expired reset token. Please request a new link.");
      return;
    }

    try {
      const res = await userService.resetPassword(token, data.password);
      setIsSuccess(true);
      toast.success(res.message || "Password has been reset successfully!");
    } catch (error: any) {
      toast.error(
        error.message || "An error occurred while resetting password."
      );
    }
  };

  if (!token) {
    return (
      <Container>
        <div className="flex justify-center items-center px-4 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] py-12">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-xl border border-red-200 dark:border-red-900/50 text-center animate-fade-in">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-6">
              <svg
                className="h-10 w-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
              Invalid Link
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              The password reset link is invalid, malformed, or has expired.
              Please request a new password reset link.
            </p>
            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="inline-flex justify-center w-full py-2.5 px-4 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Request New Link
              </Link>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <Link
                  to="/signin"
                  className="inline-flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (isSuccess) {
    return (
      <Container>
        <div className="flex justify-center items-center px-4 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] py-12">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 text-center animate-fade-in">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
              <svg
                className="h-10 w-10 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
              Reset Successful
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your password has been successfully reset and all other active
              sessions have been terminated for security. You can now log in
              using your new credentials.
            </p>
            <Button
              onClick={() => navigate("/signin")}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md"
            >
              Sign In
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex justify-center items-center px-4 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] py-12">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
          <h1 className="text-3xl font-extrabold text-center mb-2 text-gray-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
            Please enter and confirm your new password below.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="New Password"
              type="password"
              placeholder="e.g. Abc@123456"
              error={errors.password?.message}
              {...register("password", {
                required: "New password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long",
                },
              })}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="e.g. Abc@123456"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />

            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="h-11"
            >
              Reset Password
            </Button>
          </form>

          <div className="text-center mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <Link
              to="/signin"
              className="inline-flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default ResetPassword;
