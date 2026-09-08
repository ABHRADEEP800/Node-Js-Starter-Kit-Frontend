import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import userService from "../../services/userService";
import type { Passkey } from "../../types";
import {
  startRegistration,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";
import { getErrorMessage, asApiError } from "../../util/errors";

const PasskeySettings = () => {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [supported] = useState(browserSupportsWebAuthn);

  useEffect(() => {
    userService
      .listPasskeys()
      .then((res) => {
        if (res.success) setPasskeys(res.data.passkeys);
      })
      .catch((err: unknown) =>
        toast.error(getErrorMessage(err, "Failed to load passkeys"))
      )
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give this passkey a name");
      return;
    }
    if (registering) return;
    setRegistering(true);

    try {
      const optsRes = await userService.getPasskeyRegistrationOptions(trimmed);
      const registrationResponse = await startRegistration({
        optionsJSON: optsRes.data,
      });
      const verifyRes = await userService.verifyPasskeyRegistration(
        trimmed,
        registrationResponse
      );
      if (verifyRes.success) {
        setPasskeys((prev) => [verifyRes.data.passkey, ...prev]);
        setShowForm(false);
        setName("");
        toast.success(verifyRes.message);
      }
    } catch (err: unknown) {
      const error = asApiError(err);
      if (error?.name === "NotAllowedError") {
        // User cancelled the authenticator prompt.
        return;
      }
      toast.error(getErrorMessage(err, "Passkey registration failed"));
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (passkey: Passkey) => {
    if (
      !confirm(`Remove "${passkey.name}"? You won't be able to log in with it.`)
    )
      return;
    try {
      await userService.deletePasskey(passkey._id);
      setPasskeys((prev) => prev.filter((p) => p._id !== passkey._id));
      toast.success("Passkey removed");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to remove passkey"));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Passkeys
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Sign in with your fingerprint, face or device PIN instead of a
            password.
          </p>
        </div>
        {supported && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="shrink-0 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 shadow-sm"
          >
            {showForm ? "Cancel" : "Add passkey"}
          </button>
        )}
      </div>

      {!supported && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-300">
          Your current browser doesn't support passkeys. Try a recent version of
          Chrome, Edge, Safari or Firefox.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="passkey-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Passkey name
            </label>
            <input
              id="passkey-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
              placeholder="e.g. My MacBook"
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm py-2.5 px-3 outline-none transition-shadow"
            />
          </div>
          <button
            type="submit"
            disabled={registering}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 shadow-sm"
          >
            {registering ? "Waiting for authenticator…" : "Create passkey"}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
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
        ) : passkeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No passkeys registered yet.
          </div>
        ) : (
          passkeys.map((passkey) => (
            <div
              key={passkey._id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {passkey.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {passkey.credential_device_type === "multiDevice"
                      ? "Multi-device (synced)"
                      : "This device only"}
                    {passkey.last_used_at
                      ? ` · Last used ${new Date(
                          passkey.last_used_at
                        ).toLocaleDateString()}`
                      : " · Never used yet"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(passkey)}
                className="mt-3 sm:mt-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Remove passkey"
              >
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
          ))
        )}
      </div>
    </div>
  );
};

export default PasskeySettings;
