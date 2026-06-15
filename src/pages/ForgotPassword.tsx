import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { Button, Input, Container } from "../components";
import userService from "../services/userService";

interface ForgotPasswordForm {
  email: string;
}

function ForgotPasswordContent() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (!executeRecaptcha) {
      toast.error("reCAPTCHA is not yet available. Please wait.");
      return;
    }

    try {
      const recaptchaToken = await executeRecaptcha("forgot_password");
      if (!recaptchaToken) {
        toast.error("reCAPTCHA validation failed.");
        return;
      }

      const res = await userService.forgotPassword(data.email, recaptchaToken);
      setSubmittedEmail(data.email);
      toast.success(res.message || "Reset link sent!");
    } catch (error: any) {
      toast.error(error.message || "An error occurred. Please try again.");
    }
  };

  if (submittedEmail) {
    return (
      <div className="flex justify-center items-center px-4 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] py-12">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 text-center animate-fade-in">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
            <svg
              className="h-10 w-10 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.25 0L10.5 14.5"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
            Check Your Email
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            We have sent a secure recovery link to{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {submittedEmail}
            </span>
            . Please click the link inside the email to reset your password.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setSubmittedEmail(null)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium block w-full text-center"
            >
              Try another email address
            </button>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <Link
                to="/signin"
                className="inline-flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center px-4 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
        <h1 className="text-3xl font-extrabold text-center mb-2 text-gray-900 dark:text-white">
          Forgot Password
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
          Enter your email address and we'll send you a secure link to reset
          your password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. johndoe@example.com"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: "Please enter a valid email address",
              },
            })}
          />

          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="h-11"
          >
            Send Reset Link
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
  );
}

function ForgotPassword() {
  return (
    <Container>
      <GoogleReCaptchaProvider
        reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        scriptProps={{ async: true, defer: true }}
      >
        <ForgotPasswordContent />
      </GoogleReCaptchaProvider>
    </Container>
  );
}

export default ForgotPassword;
