import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  KeyIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import userService from "../../services/userService.ts";
import { useSelector } from "react-redux";
import type { AuthState } from "../../store/auth/authSlice.ts";

// --- Interfaces ---
interface UserProfile {
  fullName: string;
  email: string;
  username: string;
}

interface TwoFAStatus {
  enabled: boolean;
  verified?: boolean;
}

const Profile = () => {
  // --- 1. Global State ---
  const { loggedInUser } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const [isLoading2FA, setIsLoading2FA] = useState(true);

  // --- 2. Profile State ---
  const [user, setUser] = useState<UserProfile>({
    fullName: "",
    email: "",
    username: "",
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // --- 3. Password Modal State ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // --- 4. 2FA State ---
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFAStatus>({
    enabled: false,
  });

  // --- Initialization ---
  useEffect(() => {
    // Sync User Data from Redux
    if (loggedInUser) {
      setUser({
        fullName: loggedInUser.fullName,
        email: loggedInUser.email,
        username: loggedInUser.username,
      });
      setTempName(loggedInUser.fullName);
    }

    // Fetch 2FA Status independently
    const fetch2FA = async () => {
      try {
        const twoFaRes = await userService.get2fastatus();
        if (twoFaRes.success) {
          setTwoFAStatus(
            twoFaRes.data.twofaEnabled
              ? { enabled: true, verified: true }
              : { enabled: false }
          );
        }
      } catch (error: any) {
        console.error("Failed to fetch 2FA status", error);
      } finally {
        setIsLoading2FA(false);
      }
    };

    fetch2FA();
  }, [loggedInUser]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleUpdateName = async () => {
    if (!tempName.trim()) return toast.error("Name cannot be empty");

    try {
      setIsSavingName(true);
      const res = await userService.changeName(tempName);
      if (res.success) {
        setUser((prev) => ({ ...prev, fullName: tempName }));
        setIsEditingName(false);
        toast.success("Name updated successfully");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm)
      return toast.error("New passwords do not match");
    if (passForm.new.length < 6)
      return toast.error("Password must be at least 6 characters");

    try {
      const res = await userService.changePassword(
        passForm.current,
        passForm.new
      );
      if (res.success) {
        toast.success("Password changed successfully");
        setShowPasswordModal(false);
        setPassForm({ current: "", new: "", confirm: "" });
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to change password");
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  if (!user.email) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update your profile and view security status.
          </p>
        </div>

        {/* Grid Layout: Stacked on Mobile (1 col), Split on Desktop (3 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* --- LEFT COLUMN: Profile Info (2 cols wide on desktop) --- */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                {/* Avatar & Basic Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-sm">
                      <UserCircleIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left pt-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {user.username}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {loggedInUser?.role === "admin"
                        ? "Administrator"
                        : "User"}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Name Edit Section */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Full Name
                      </label>
                      {!isEditingName && (
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white text-xs font-medium flex items-center transition-colors"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditingName ? (
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        {/* Fixed Duplicate w-full here */}
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md focus:ring-1 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white block p-2.5 mb-3 outline-none"
                          autoFocus
                          placeholder="Enter your full name"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setIsEditingName(false);
                              setTempName(user.fullName);
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateName}
                            disabled={isSavingName}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50"
                          >
                            {isSavingName ? (
                              "Saving..."
                            ) : (
                              <>
                                <CheckIcon className="w-3.5 h-3.5 mr-1.5" />
                                Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-900 dark:text-white text-base">
                        {user.fullName || "Not set"}
                      </p>
                    )}
                  </div>

                  {/* Password Button */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                          Password
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                      >
                        <KeyIcon className="w-4 h-4 mr-2 text-gray-500" />
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: 2FA Status (1 col on desktop) --- */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="w-6 h-6 text-gray-900 dark:text-white mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Security
                </h3>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center py-6">
                  {isLoading2FA ? (
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`mx-auto flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                          twoFAStatus.enabled
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                        }`}
                      >
                        <ShieldCheckIcon className="w-8 h-8" />
                      </div>

                      <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                        Two-Factor Authentication
                      </h4>

                      <p
                        className={`text-sm font-medium mb-3 ${
                          twoFAStatus.enabled
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {twoFAStatus.enabled
                          ? "Enabled & Active"
                          : "Currently Disabled"}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed px-2">
                        {twoFAStatus.enabled
                          ? "Your account is protected with an extra layer of security."
                          : "2FA is not set up on this account."}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Password Change Modal --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowPasswordModal(false)}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                {[
                  { label: "Current Password", key: "current" },
                  { label: "New Password", key: "new" },
                  { label: "Confirm Password", key: "confirm" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        type={
                          showPass[field.key as keyof typeof showPass]
                            ? "text"
                            : "password"
                        }
                        value={passForm[field.key as keyof typeof passForm]}
                        onChange={(e) =>
                          setPassForm({
                            ...passForm,
                            [field.key]: e.target.value,
                          })
                        }
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white sm:text-sm py-2.5 px-3 pr-10 outline-none transition-shadow"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        onClick={() =>
                          setShowPass((prev) => ({
                            ...prev,
                            [field.key]:
                              !prev[field.key as keyof typeof showPass],
                          }))
                        }
                      >
                        {showPass[field.key as keyof typeof showPass] ? (
                          <EyeSlashIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-8 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-lg shadow-sm transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
