// src/services/adminPrivacyService.ts
// Admin-only DPDP control-plane surfaces backed by /api/v1/admin/privacy:
// nominee claims (s. 14), the rights/grievance inbox (ss. 11–14, Rule 14),
// breach workflow (s. 8(6), Rule 7), retention (Rule 8), cross-border transfer
// register (s. 16, Rule 15), DPIA/SDF register (s. 10, Rule 13) and audit
// integrity (Rule 6(c)).
import type { ApiResponse } from "../types";
import ApiError from "../util/ApiError";
import { apiClient } from "../util/apiClient";

export type NomineeClaimStatus = "pending" | "approved" | "rejected";

export interface NomineeClaim {
  _id: string;
  claim_id: string;
  data_principal_id: string;
  nominee_index: number;
  claimant_name: string;
  claimant_contact: string | null;
  claimant_relationship: string | null;
  basis: "death" | "incapacity";
  evidence_hash: string;
  note: string | null;
  status: NomineeClaimStatus;
  requested_at: string;
  decided_at: string | null;
  decision_note: string | null;
  actions?: { at: string; action: string; actor: string }[];
}

export interface AdminNomineeView {
  name: string | null;
  relationship: string | null;
  contact: string | null;
  share: string | null;
  status: string;
  addedAt?: string;
  revokedAt?: string | null;
}

export type RightsCaseType =
  | "access"
  | "correction"
  | "erasure"
  | "withdraw"
  | "grievance"
  | "nomination";

export type RightsCaseStatus =
  | "received"
  | "in_progress"
  | "completed"
  | "rejected"
  | "escalated";

export interface AdminRightsCase {
  case_id: string;
  user_id: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string | null;
  } | null;
  type: RightsCaseType;
  status: RightsCaseStatus;
  purpose_id: string | null;
  requested_at: string;
  acknowledged_at: string | null;
  sla_due_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  escalation?: {
    to_board: boolean;
    at: string | null;
    board_reference: string | null;
  };
}

export interface SlaCase {
  case_id: string;
  type: RightsCaseType;
  status: RightsCaseStatus;
  sla_due_at: string;
  overdue: boolean;
  days_left: number;
}

// ---- Breach (s. 8(6), Rule 7) ----
export type BreachSeverity = "low" | "medium" | "high" | "critical";
export type BreachStatus = "open" | "contained" | "notified" | "closed";

export interface BreachIncident {
  _id: string;
  incident_id: string;
  title: string;
  description: string;
  severity: BreachSeverity;
  status: BreachStatus;
  nature: string | null;
  extent: string | null;
  affected_count: number;
  involves_children: boolean;
  data_categories: string[];
  occurred_at: string | null;
  detected_at: string;
  board_first_report_due_at: string | null;
  board_detailed_report_due_at: string | null;
  board_first_reported_at: string | null;
  board_detailed_reported_at: string | null;
  data_principals_notified_at: string | null;
  board_extension_granted: boolean;
  timeline?: { at: string; actor: string; event: string; note?: string }[];
  post_mortem: string | null;
  createdAt: string;
}

export interface BreachCreateInput {
  title: string;
  description: string;
  impact?: { confidentiality?: boolean; integrity?: boolean; availability?: boolean };
  severity?: BreachSeverity;
  nature?: string;
  extent?: string;
  location?: string;
  likely_impact?: string;
  dataCategories?: string[];
  affectedCount?: number;
  involvesChildren?: boolean;
  cause?: string;
  occurredAt?: string;
  detectedAt?: string;
}

export interface BreachDrafts {
  board_first_report: { to: string; subject: string; reference: string; body: string; due_at: string };
  board_detailed_report: { to: string; subject: string; reference: string; body: string; due_at: string };
  data_principal_notice: { subject: string; body: string; contact: string; rule: string };
  countdown: {
    incident_id: string;
    severity: string;
    status: string;
    first_report_hours_left: number | null;
    first_report_overdue: boolean;
    detailed_report_hours_left: number | null;
    detailed_report_overdue: boolean;
    extension_granted: boolean;
  };
}

export type BreachStage =
  | "board_first"
  | "board_detailed"
  | "data_principals"
  | "contained"
  | "close"
  | "extension";

// ---- Transfer register (s. 16, Rule 15) ----
export interface TransferEntry {
  _id: string;
  country: string;
  recipient: string;
  recipient_type: string;
  purpose_id: string;
  lawful_basis: string;
  data_categories: string[];
  safeguards: string[];
  mechanism: string;
  is_foreign_state_entity: boolean;
  restricted: boolean;
  restricted_reference: string | null;
  active: boolean;
}

export interface TransferInput {
  id?: string;
  country: string;
  recipient: string;
  recipient_type?: string;
  purpose_id: string;
  lawful_basis: string;
  data_categories?: string[];
  safeguards?: string[];
  mechanism?: string;
  is_foreign_state_entity?: boolean;
  restricted?: boolean;
  restricted_reference?: string;
  active?: boolean;
}

// ---- DPIA / SDF register (s. 10, Rule 13) ----
export interface DpiaEntry {
  _id: string;
  activity_name: string;
  purpose_ids: string[];
  lawful_basis: string | null;
  data_categories: string[];
  cross_border: boolean;
  automated_decisions: boolean;
  residual_rating: string;
  decision: string;
  is_sdf: boolean;
  dpo_name: string | null;
  auditor_name: string | null;
  reviewed_at: string;
  next_review_due_at: string | null;
}

export interface DpiaInput {
  id?: string;
  activity_name: string;
  purpose_ids?: string[];
  lawful_basis?: string;
  data_categories?: string[];
  cross_border?: boolean;
  automated_decisions?: boolean;
  necessity_notes?: string;
  residual_rating?: string;
  decision?: string;
  conditions?: string[];
  is_sdf?: boolean;
  dpo_name?: string;
  dpo_india_based?: boolean;
  auditor_name?: string;
  localisation_notes?: string;
  next_review_due_at?: string;
}

export interface AuditEntry {
  _id: string;
  action: string;
  category: string;
  status: "SUCCESS" | "FAILED";
  details?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  createdAt: string;
}

export interface AuditIntegrityResult {
  valid: boolean;
  brokenAt: string | null;
  index: number;
  count: number;
  anchored?: boolean;
}

export interface RetentionSummary {
  dryRun?: boolean;
  scanned?: number;
  erased?: number;
  retained?: number;
  [key: string]: unknown;
}

class AdminPrivacyService {
  // ---- Nominee claims (s. 14) ----
  async listNomineeClaims(
    status?: NomineeClaimStatus
  ): Promise<ApiResponse<{ claims: NomineeClaim[] }>> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const response = await apiClient(`/admin/privacy/nominee-claims${query}`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load claims");
    return data;
  }

  async decideNomineeClaim(
    claimId: string,
    decision: "approve" | "reject",
    note?: string
  ): Promise<ApiResponse<{ claim_id: string; status: NomineeClaimStatus }>> {
    const response = await apiClient(
      `/admin/privacy/nominee-claims/${encodeURIComponent(claimId)}/decide`,
      {
        method: "POST",
        body: JSON.stringify({ decision, note }),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to decide claim");
    return data;
  }

  /** Inspect a Data Principal's nominee list (for claim verification). */
  async getNominees(
    userId: string
  ): Promise<ApiResponse<{ nominees: AdminNomineeView[]; claim: unknown }>> {
    const response = await apiClient(
      `/admin/privacy/nominees/${encodeURIComponent(userId)}`,
      { method: "GET" }
    );
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load nominees");
    return data;
  }

  // ---- Rights / grievance inbox + SLA (ss. 11–14) ----
  async listRightsCases(filter?: {
    type?: RightsCaseType;
    status?: RightsCaseStatus;
  }): Promise<ApiResponse<{ cases: AdminRightsCase[]; count: number }>> {
    const params = new URLSearchParams();
    if (filter?.type) params.set("type", filter.type);
    if (filter?.status) params.set("status", filter.status);
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await apiClient(`/admin/privacy/rights/cases${query}`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load cases");
    return data;
  }

  async updateRightsCase(
    caseId: string,
    update: {
      status?: RightsCaseStatus;
      resolution_notes?: string;
      board_reference?: string;
    }
  ): Promise<ApiResponse<{ case: AdminRightsCase }>> {
    const response = await apiClient(
      `/admin/privacy/rights/cases/${encodeURIComponent(caseId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(update),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to update case");
    return data;
  }

  /** SLA dashboard: open cases with days-left/overdue (Rule 14). */
  async getSlaDashboard(): Promise<ApiResponse<{ cases: SlaCase[] }>> {
    const response = await apiClient("/admin/privacy/rights", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load SLA status");
    return data;
  }

  // ---- Breach workflow (s. 8(6), Rule 7) ----
  async listBreaches(): Promise<ApiResponse<{ incidents: BreachIncident[] }>> {
    const response = await apiClient("/admin/privacy/breaches", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load incidents");
    return data;
  }

  async createBreach(
    input: BreachCreateInput
  ): Promise<ApiResponse<{ incident: BreachIncident }>> {
    const response = await apiClient("/admin/privacy/breaches", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to open incident");
    return data;
  }

  async getBreachReport(
    incidentId: string
  ): Promise<ApiResponse<{ json: BreachIncident; human: string; evidence_hash: string; generated_at: string }>> {
    const response = await apiClient(
      `/admin/privacy/breaches/${encodeURIComponent(incidentId)}/report`,
      { method: "GET" }
    );
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load report");
    return data;
  }

  async getBreachDrafts(
    incidentId: string
  ): Promise<ApiResponse<BreachDrafts>> {
    const response = await apiClient(
      `/admin/privacy/breaches/${encodeURIComponent(incidentId)}/drafts`,
      { method: "GET" }
    );
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load drafts");
    return data;
  }

  async notifyBreach(
    incidentId: string,
    stage: BreachStage,
    note?: string
  ): Promise<ApiResponse<{ incident: BreachIncident }>> {
    const response = await apiClient(
      `/admin/privacy/breaches/${encodeURIComponent(incidentId)}/notify`,
      {
        method: "POST",
        body: JSON.stringify({ stage, note }),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to update incident");
    return data;
  }

  // ---- Retention / erasure (Rule 8) ----
  async runRetention(
    dryRun = true
  ): Promise<ApiResponse<RetentionSummary>> {
    const response = await apiClient("/admin/privacy/retention/run", {
      method: "POST",
      body: JSON.stringify({ dryRun }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to run retention");
    return data;
  }

  // ---- Transfer register (s. 16, Rule 15) ----
  async listTransfers(): Promise<ApiResponse<{ transfers: TransferEntry[] }>> {
    const response = await apiClient("/admin/privacy/transfers", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load transfers");
    return data;
  }

  async upsertTransfer(
    input: TransferInput
  ): Promise<ApiResponse<{ transfer: TransferEntry }>> {
    const response = await apiClient("/admin/privacy/transfers", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to save transfer");
    return data;
  }

  // ---- DPIA / SDF register (s. 10, Rule 13) ----
  async listDpias(): Promise<ApiResponse<{ dpias: DpiaEntry[] }>> {
    const response = await apiClient("/admin/privacy/dpia", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load DPIAs");
    return data;
  }

  async upsertDpia(
    input: DpiaInput
  ): Promise<ApiResponse<{ dpia: DpiaEntry }>> {
    const response = await apiClient("/admin/privacy/dpia", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to save DPIA");
    return data;
  }

  // ---- Audit (Rule 6(c)) ----
  async verifyAuditChain(): Promise<ApiResponse<AuditIntegrityResult>> {
    const response = await apiClient("/admin/privacy/audit/verify", { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to verify audit chain");
    return data;
  }

  async listAudit(
    filter?: { category?: string; limit?: number }
  ): Promise<ApiResponse<{ entries: AuditEntry[] }>> {
    const params = new URLSearchParams();
    if (filter?.category) params.set("category", filter.category);
    if (filter?.limit) params.set("limit", String(filter.limit));
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await apiClient(`/admin/privacy/audit${query}`, { method: "GET" });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load audit log");
    return data;
  }

  // ---- Admin user lookup (GET /admin/users/:id) ----
  async getUser(
    userId: string
  ): Promise<ApiResponse<{ user: Record<string, unknown> }>> {
    const response = await apiClient(`/admin/users/${encodeURIComponent(userId)}`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.message || "Failed to load user");
    return data;
  }
}

export default new AdminPrivacyService();
