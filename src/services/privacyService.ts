// src/services/privacyService.ts
// DPDP Act 2023 — notice, consent and Data Principal rights (ss. 5–14).
import type { ApiResponse } from "../types";
import type {
  NoticeResponse,
  PurposesResponse,
  ConsentStateResponse,
  AgeStatusResponse,
  RightsCase,
  CookieStateResponse,
  CookieDecision,
  CookieConsentResult,
  PublicNominee,
  GuardianConsentInput,
} from "../types/dpdp";
import ApiError from "../util/ApiError";
import { apiClient } from "../util/apiClient";

export interface NomineeInput {
  name: string;
  relationship?: string;
  email?: string;
  phone?: string;
  share?: string;
}

class PrivacyService {
  /** Public: the itemised consent notice (s. 5, Rule 3). */
  async getNotice(language = "en"): Promise<ApiResponse<NoticeResponse>> {
    const response = await apiClient(
      `/privacy/notice?language=${encodeURIComponent(language)}`,
      { method: "GET" }
    );
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load notice");
    return data;
  }

  /** Public: purpose registry for rendering opt-ins. */
  async getPurposes(): Promise<ApiResponse<PurposesResponse>> {
    const response = await apiClient("/privacy/purposes", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load purposes");
    return data;
  }

  async getConsent(): Promise<ApiResponse<ConsentStateResponse>> {
    const response = await apiClient("/privacy/consent", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load consent");
    return data;
  }

  async grantConsent(
    purposes: string[],
    language = "en"
  ): Promise<ApiResponse<{ consent_id: string; evidence_hash: string }>> {
    const response = await apiClient("/privacy/consent/grant", {
      method: "POST",
      body: JSON.stringify({ purposes, language }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to record consent");
    return data;
  }

  async withdrawConsent(
    purposeId: string
  ): Promise<ApiResponse<{ consent_id: string; purposes: string[] }>> {
    const response = await apiClient("/privacy/consent/withdraw", {
      method: "POST",
      body: JSON.stringify({ purposeId }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to withdraw consent");
    return data;
  }

  /** s. 11 — access. */
  async getMyData(): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await apiClient("/privacy/data", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to fetch your data");
    return data;
  }

  /** s. 12 — correction. */
  async correctMyData(
    updates: { firstName?: string; lastName?: string; email?: string }
  ): Promise<ApiResponse<{ case_id: string }>> {
    const response = await apiClient("/privacy/correct", {
      method: "POST",
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to correct your data");
    return data;
  }

  /** s. 12 — erasure (hard delete). */
  async eraseMyData(): Promise<
    ApiResponse<{ case_id: string; certificate_id: string | null }>
  > {
    const response = await apiClient("/privacy/erase", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to erase your data");
    return data;
  }

  /** s. 13 — grievance. */
  async raiseGrievance(
    subject: string,
    message: string
  ): Promise<ApiResponse<{ case_id: string; sla_due_at: string }>> {
    const response = await apiClient("/privacy/grievance", {
      method: "POST",
      body: JSON.stringify({ subject, message }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to submit grievance");
    return data;
  }

  async escalateGrievance(
    caseId: string
  ): Promise<ApiResponse<{ case_id: string }>> {
    const response = await apiClient("/privacy/grievance/escalate", {
      method: "POST",
      body: JSON.stringify({ case_id: caseId }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to escalate");
    return data;
  }

  /** s. 14 — nomination. */
  async nominate(
    nominees: NomineeInput[]
  ): Promise<ApiResponse<{ case_id: string; nominees: unknown[] }>> {
    const response = await apiClient("/privacy/nominate", {
      method: "POST",
      body: JSON.stringify({ nominees }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to record nominee");
    return data;
  }

  // ---- s. 14 nominee management ----
  async listNominees(): Promise<ApiResponse<{ nominees: PublicNominee[] }>> {
    const response = await apiClient("/privacy/nominees", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load nominees");
    return data;
  }

  async saveNominees(
    nominees: NomineeInput[]
  ): Promise<ApiResponse<{ nominees: PublicNominee[] }>> {
    const response = await apiClient("/privacy/nominees", {
      method: "PUT",
      body: JSON.stringify({ nominees }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to save nominees");
    return data;
  }

  async editNominee(
    index: number,
    updates: Partial<NomineeInput>
  ): Promise<ApiResponse<{ nominee: PublicNominee }>> {
    const response = await apiClient(`/privacy/nominees/${index}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to update nominee");
    return data;
  }

  async removeNominee(
    index: number
  ): Promise<ApiResponse<{ nominee: PublicNominee }>> {
    const response = await apiClient(`/privacy/nominees/${index}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to remove nominee");
    return data;
  }

  /** PUBLIC: a nominee files a death/incapacity claim (s. 14). */
  async submitNomineeClaim(payload: {
    dataPrincipalId: string;
    nomineeIndex?: number;
    claimantName: string;
    claimantContact?: string;
    claimantRelationship?: string;
    basis: "death" | "incapacity";
    evidenceReference?: string;
    note?: string;
  }): Promise<ApiResponse<{ claim_id: string; status: string }>> {
    const response = await apiClient("/privacy/nominee-claim", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to submit claim");
    return data;
  }

  async listCases(): Promise<ApiResponse<{ cases: RightsCase[] }>> {
    const response = await apiClient("/privacy/cases", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to list requests");
    return data;
  }

  async getAgeStatus(): Promise<ApiResponse<AgeStatusResponse>> {
    const response = await apiClient("/privacy/age-status", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load age status");
    return data;
  }

  /**
   * s. 9 / Rule 10 — record verifiable guardian consent for a child account
   * (used when an under-18 account must add / re-verify guardian consent).
   */
  async submitGuardianConsent(
    payload: GuardianConsentInput
  ): Promise<ApiResponse<{ guardian_consent_id: string; evidence_hash: string }>> {
    const response = await apiClient("/privacy/guardian-consent", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "Failed to record guardian consent");
    return data;
  }

  /**
   * Rule 6(c) — self-service proof that the audit trail is intact
   * (hash-chain verification; returns pass/fail + counts only).
   */
  async verifyAuditIntegrity(): Promise<
    ApiResponse<{ valid: boolean; brokenAt: string | null; index: number; count: number }>
  > {
    const response = await apiClient("/privacy/audit/verify", { method: "GET" });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.message || "Failed to verify audit integrity");
    return data;
  }

  // ==========================================
  // 🍪 DOMAIN 8: COOKIE / TRACKER CONSENT (public)
  // ==========================================
  /** Registry + current preferences + the authoritative dispatch list. */
  async getCookieState(): Promise<ApiResponse<CookieStateResponse>> {
    const response = await apiClient("/privacy/cookies", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load cookie settings");
    return data;
  }

  async saveCookieConsent(
    decision: CookieDecision
  ): Promise<ApiResponse<CookieConsentResult>> {
    const response = await apiClient("/privacy/cookies/consent", {
      method: "POST",
      body: JSON.stringify(decision),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to save cookie consent");
    return data;
  }

  async withdrawCookieConsent(
    category: string = "all"
  ): Promise<ApiResponse<{ dispatch: string[] }>> {
    const response = await apiClient("/privacy/cookies/withdraw", {
      method: "POST",
      body: JSON.stringify({ category }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to withdraw cookie consent");
    return data;
  }
}

export default new PrivacyService();
