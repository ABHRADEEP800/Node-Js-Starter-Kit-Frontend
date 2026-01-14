// src/pages/settings/TwoFASettingsPage.tsx

import { useState, useEffect, useRef } from "react";
import userService from "../../services/userService";
import type { SessionDevice } from "../../services/userService";
import { toast } from "react-toastify";

// --- Types ---
interface TwoFAStatus {
  enabled: boolean;
  verified?: boolean;
}

interface TwoFASecret {
  secret: string;
  qrCode: string;
}

const TwoFASettingsPage = () => {
  // --- 2FA State ---
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFAStatus>({
    enabled: false,
  });
  const [twoFASecret, setTwoFASecret] = useState<TwoFASecret | null>(null);
  const [verificationCode, setVerificationCode] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"status" | "generating" | "verifying">(
    "status"
  );

  // --- Session State ---
  const [sessions, setSessions] = useState<SessionDevice[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Initial Data Fetching ---
  useEffect(() => {
    fetchTwoFAStatus();
    fetchSessions();
  }, []);

  // ==========================================
  // 🔐 2FA LOGIC
  // ==========================================

  const fetchTwoFAStatus = async () => {
    try {
      setIs2FALoading(true);
      const response = await userService.get2fastatus();
      if (response.success) {
        setTwoFAStatus(
          response.data.twofaEnabled
            ? { enabled: true, verified: true }
            : { enabled: false }
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch 2FA status");
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleGenerate2FA = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const response = await userService.generate2FASecret();
      if (response.success) {
        setTwoFASecret(response.data);
        setStep("generating");
        toast.info("Scan the QR code with your authenticator app");
      }
    } catch (error: any) {
      setError(error?.message || "Failed to generate 2FA secret");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").split("").slice(0, 6);
    const newCode = [...verificationCode];
    digits.forEach((digit, index) => {
      if (index < 6) newCode[index] = digit;
    });
    setVerificationCode(newCode);
    const nextEmptyIndex = newCode.findIndex((digit) => digit === "");
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    try {
      setIs2FALoading(true);
      setError(null);
      const response = await userService.change2FAStatus(code);
      if (response.success) {
        setTwoFAStatus({ enabled: true, verified: true });
        setStep("status");
        setTwoFASecret(null);
        setVerificationCode(["", "", "", "", "", ""]);
        toast.success("Two-factor authentication enabled successfully");
      }
    } catch (error: any) {
      setError(error?.message || "Failed to enable 2FA");
      setVerificationCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    try {
      setIs2FALoading(true);
      setError(null);
      const response = await userService.change2FAStatus(code);
      if (response.success) {
        setTwoFAStatus({ enabled: false, verified: false });
        setStep("status");
        setVerificationCode(["", "", "", "", "", ""]);
        toast.success("Two-factor authentication disabled successfully");
      }
    } catch (error: any) {
      setError(error?.message || "Failed to disable 2FA");
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleCancel = () => {
    setStep("status");
    setTwoFASecret(null);
    setVerificationCode(["", "", "", "", "", ""]);
    setError(null);
  };

  // ==========================================
  // 📱 DEVICE MANAGEMENT LOGIC
  // ==========================================

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await userService.getActiveSessions();
      if (response.success) {
        setSessions(response.data.sessions);
      }
    } catch (error: any) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to log out this device?")) return;
    try {
      await userService.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Device logged out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke session");
    }
  };

  const handleRevokeAllOther = async () => {
    if (!confirm("Are you sure you want to log out all other devices?")) return;
    try {
      await userService.revokeAllOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("All other devices logged out");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke devices");
    }
  };

  // Helper to determine icon
  const getDeviceIcon = (os: string, browser: string) => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        os
      ) || /Mobile/i.test(browser);

    if (isMobile) {
      return (
        <svg
          className="w-6 h-6 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-6 h-6 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    );
  };

  // ==========================================
  // 🖥️ RENDER
  // ==========================================

  if (is2FALoading && step === "status") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Security Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account security and active sessions
          </p>
        </div>

        {/* ======================= */}
        {/* 1. 2FA SECTION          */}
        {/* ======================= */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          {/* Status View */}
          {step === "status" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div
                  className={`hidden sm:block px-3 py-1 rounded-full text-sm font-medium ${
                    twoFAStatus.enabled
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                  }`}
                >
                  {twoFAStatus.enabled ? "Enabled" : "Disabled"}
                </div>
              </div>

              {/* Mobile Badge */}
              <div className="sm:hidden">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    twoFAStatus.enabled
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                  }`}
                >
                  {twoFAStatus.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {twoFAStatus.enabled
                        ? "2FA is protecting your account"
                        : "Secure your account"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {twoFAStatus.enabled
                        ? "Your account is secured. You'll need a verification code when signing in."
                        : "Require a verification code from your authenticator app in addition to your password."}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  {twoFAStatus.enabled ? (
                    <button
                      onClick={() => setStep("verifying")}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 shadow-sm flex justify-center items-center"
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerate2FA}
                      disabled={isGenerating}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 shadow-sm flex items-center justify-center"
                    >
                      {isGenerating ? "Setting up..." : "Enable 2FA"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* QR Code Step */}
          {step === "generating" && twoFASecret && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Set up Authenticator App
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 text-center">
                <div className="bg-white p-4 rounded-lg inline-block border border-gray-300 mb-6">
                  <img
                    src={twoFASecret.qrCode}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Manual Entry Code:
                </p>
                <code className="bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 select-all font-mono text-sm">
                  {twoFASecret.secret}
                </code>
                <div className="mt-6">
                  <button
                    onClick={() => setStep("verifying")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold w-full sm:w-auto"
                  >
                    I've Scanned It
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Verification Step */}
          {step === "verifying" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {twoFAStatus.enabled ? "Verify to Disable" : "Verify to Enable"}
              </h2>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <form
                onSubmit={
                  twoFAStatus.enabled ? handleDisable2FA : handleEnable2FA
                }
              >
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <div
                    className="flex gap-2 justify-center mb-6"
                    onPaste={handlePaste}
                  >
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }} 
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleDigitChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                        disabled={is2FALoading}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="submit"
                      disabled={is2FALoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold w-full sm:w-auto"
                    >
                      {is2FALoading ? "Verifying..." : "Confirm Code"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white px-6 py-3 rounded-lg font-semibold w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ======================= */}
        {/* 2. SESSIONS SECTION     */}
        {/* ======================= */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Active Sessions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                Manage the devices logged into your account
              </p>
            </div>

            {sessions.length > 1 && (
              <button
                onClick={handleRevokeAllOther}
                className="w-full sm:w-auto text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Log out all other devices
              </button>
            )}
          </div>

          <div className="space-y-4">
            {loadingSessions ? (
              // Skeleton Loader for Sessions
              [1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center p-4 border rounded-xl"
                >
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mr-4"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active sessions found.
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    session.isCurrent
                      ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start gap-4 w-full sm:w-auto">
                    {/* Device Icon */}
                    <div
                      className={`p-3 rounded-lg ${
                        session.isCurrent
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {getDeviceIcon(session.os, session.browser)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {session.os}{" "}
                          <span className="text-gray-400 mx-1">•</span>{" "}
                          {session.browser}
                        </h3>
                        {session.isCurrent && (
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 rounded-full font-medium border border-green-200 dark:border-green-800">
                            Current Session
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {session.ip}
                        </span>
                        <span className="hidden sm:inline text-gray-300">
                          •
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {session.isCurrent
                            ? "Active now"
                            : new Date(session.lastSeen).toLocaleDateString() +
                              " " +
                              new Date(session.lastSeen).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!session.isCurrent && (
                    <div className="mt-4 sm:mt-0 pl-0 sm:pl-4 w-full sm:w-auto flex sm:block border-t sm:border-t-0 border-gray-100 dark:border-gray-700 pt-3 sm:pt-0">
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto flex items-center justify-center gap-2 group"
                        title="Log out device"
                      >
                        <span className="sm:hidden text-sm font-medium">
                          Log out device
                        </span>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFASettingsPage;
