// src/services/UserService.ts

import type { ApiResponse, User, UserLogin, Passkey } from "../types/";
import type { UserSignup } from "../types/userSignup";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "../types/passkey";
import type {
  PublicKeyCredentialRequestOptionsJSON,
  PublicKeyCredentialCreationOptionsJSON,
} from "@simplewebauthn/browser";
import ApiError from "../util/ApiError";
import { apiClient } from "../util/apiClient"; // 👈 Import the new client

// Define Types for Device Management
export interface SessionDevice {
  id: string;
  ip: string;
  browser: string;
  os: string;
  lastSeen: string;
  isCurrent: boolean;
  remember: boolean;
}

class UserService {
  // Note: BASE_URL is now handled inside apiClient, so we just pass endpoints

  // ==========================================
  // 🚀 AUTH METHODS
  // ==========================================

  async userSignup(
    userDetails: UserSignup
  ): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient("/user/create", {
      method: "POST",
      body: JSON.stringify({ user: userDetails }),
    });

    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Signup failed");
    return data;
  }

  async userLogin(credentials: UserLogin & { rememberMe?: boolean }): Promise<
    ApiResponse<{
      user: User | null;
      twofaEnabled?: boolean;
      tempToken?: string | null;
    }>
  > {
    const response = await apiClient("/user/login", {
      method: "POST",
      body: JSON.stringify({ user: credentials }),
    });

    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Login failed");
    return data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient("/user/logout", { method: "POST" });
    } catch (error) {
      console.warn("Logout failed on server, ignoring.", error);
    }
  }

  async verifyLogin2FA(code: string): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient("/user/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "2FA Verification failed");
    return data;
  }

  // ==========================================
  // 📱 DEVICE MANAGEMENT METHODS
  // ==========================================

  async getActiveSessions(): Promise<
    ApiResponse<{ sessions: SessionDevice[] }>
  > {
    // Notice we pass the full endpoint path relative to BASE_URL in apiClient
    const response = await apiClient("/user/sessions", {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "Failed to fetch sessions");
    return data;
  }

  async revokeSession(sessionId: string): Promise<ApiResponse<null>> {
    const response = await apiClient("/user/sessions/revoke", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "Failed to logout device");
    return data;
  }

  async revokeAllOtherSessions(): Promise<ApiResponse<null>> {
    const response = await apiClient("/user/sessions/revoke-all", {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "Failed to logout other devices");
    return data;
  }

  // ==========================================
  // 👤 PROFILE METHODS
  // ==========================================

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient("/user/profile");
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message);
    return data;
  }

  async get2fastatus(): Promise<ApiResponse<{ twofaEnabled: boolean }>> {
    const response = await apiClient("/user/2fa/status", {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message);
    return data;
  }

  async generate2FASecret(): Promise<
    ApiResponse<{ qrCode: string; secret: string }>
  > {
    const response = await apiClient("/user/2fa/generate", {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message);
    return data;
  }

  async change2FAStatus(
    code: string,
    enable?: boolean
  ): Promise<ApiResponse<{ twofaEnabled: boolean }>> {
    const response = await apiClient("/user/2fa/change", {
      method: "POST",
      body: JSON.stringify({ code, enable }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message);
    return data;
  }

  async changeName(
    firstName: string,
    lastName: string
  ): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient("/user/change-name", {
      method: "POST",
      body: JSON.stringify({ firstName, lastName }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message);
    return data;
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient("/user/change-pass", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message);
    return data;
  }

  async forgotPassword(
    email: string,
    recaptchaToken: string
  ): Promise<ApiResponse<null>> {
    const response = await apiClient("/user/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, recaptchaToken }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "Failed to submit request");
    return data;
  }

  async resetPassword(
    token: string,
    password: string
  ): Promise<ApiResponse<null>> {
    const response = await apiClient("/user/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "Failed to reset password");
    return data;
  }

  async checkUsernameAvailability(
    username: string,
    signal?: AbortSignal
  ): Promise<{ available: boolean; message: string }> {
    const response = await apiClient(
      `/user/check-username?username=${encodeURIComponent(username)}`,
      {
        method: "GET",
        signal, // allows the caller to cancel in-flight availability checks
      }
    );
    const data = await response.json();
    return {
      available: data.data?.available ?? false,
      message: data.message || "",
    };
  }

  async checkEmailAvailability(
    email: string,
    signal?: AbortSignal
  ): Promise<{ available: boolean; message: string }> {
    const response = await apiClient(
      `/user/check-email?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        signal, // allows the caller to cancel in-flight availability checks
      }
    );
    const data = await response.json();
    return {
      available: data.data?.available ?? false,
      message: data.message || "",
    };
  }

  // ==========================================
  // 🔑 PASSKEY (WEBAUTHN) METHODS
  // ==========================================

  /**
   * Public — starts a passkey login. `identifier` (username/email) is optional;
   * omitting it yields an empty allow-list and lets the user pick any passkey.
   * Returns options ready for `startAuthentication()`.
   */
  async getPasskeyLoginOptions(
    identifier: string,
    recaptchaToken: string
  ): Promise<ApiResponse<PublicKeyCredentialRequestOptionsJSON>> {
    const response = await apiClient("/user/passkey/login/options", {
      method: "POST",
      body: JSON.stringify({ identifier, recaptchaToken }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "Failed to start passkey login");
    return data;
  }

  async verifyPasskeyLogin(
    response: AuthenticationResponseJSON,
    rememberMe: boolean
  ): Promise<
    ApiResponse<{
      user: User | null;
      twofaEnabled?: boolean;
      csrfToken?: string;
    }>
  > {
    const res = await apiClient("/user/passkey/login/verify", {
      method: "POST",
      body: JSON.stringify({ response, rememberMe }),
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data.message || "Passkey login failed");
    return data;
  }

  async getPasskeyRegistrationOptions(
    name: string
  ): Promise<ApiResponse<PublicKeyCredentialCreationOptionsJSON>> {
    const response = await apiClient("/user/passkey/register/options", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(
        data.message || "Failed to start passkey registration"
      );
    return data;
  }

  async verifyPasskeyRegistration(
    name: string,
    response: RegistrationResponseJSON
  ): Promise<ApiResponse<{ passkey: Passkey }>> {
    const res = await apiClient("/user/passkey/register/verify", {
      method: "POST",
      body: JSON.stringify({ name, response }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new ApiError(data.message || "Passkey registration failed");
    return data;
  }

  async listPasskeys(): Promise<ApiResponse<{ passkeys: Passkey[] }>> {
    const response = await apiClient("/user/passkey/list", {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "Failed to list passkeys");
    return data;
  }

  async deletePasskey(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient(
      `/user/passkey/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "Failed to remove passkey");
    return data;
  }
}

export default new UserService();
