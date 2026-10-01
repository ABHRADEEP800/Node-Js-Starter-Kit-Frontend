// DPDP Act 2023 — client-side mirror of the backend privacy DTOs.

export interface DpoContact {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface BoardInfo {
  name: string;
  url: string;
  note: string;
}

export interface ConsentPurpose {
  id: string;
  label: string;
  description: string;
  lawful_basis: string;
  required: boolean;
  retention_days: number | null;
  fields: string[];
}

export interface NoticeItem {
  purpose_id: string;
  personal_data: string[];
  purpose: string;
  purpose_description: string;
  lawful_basis: string;
  required: boolean;
  retention_days: number | null;
}

export interface NoticeCookieCategory {
  id: string;
  label: string;
  description: string;
  lawful_basis: string;
  consent_required: boolean;
  default_on: boolean;
  examples: string[];
}

export interface NoticeStrings {
  heading: string;
  languageLabel: string;
  noticeVersionLabel: string;
  translatedBadge: string;
  fallbackBadge: string;
  fallbackNotice: string;
  whoWeAreTitle: string;
  dataFiduciaryText: string;
  dpoLabel: string;
  collectTitle: string;
  requiredLabel: string;
  optionalLabel: string;
  dataLabel: string;
  lawfulBasisLabel: string;
  retentionDaysLabel: string;
  retentionActiveLabel: string;
  notCollectTitle: string;
  cookiesTitle: string;
  consentRequiredLabel: string;
  alwaysOnLabel: string;
  examplesLabel: string;
  cookieSettingsNote: string;
  rightsTitle: string;
  manageInPrivacyCenter: string;
  privacyCenterLink: string;
  cookieSettingsButton: string;
  boardComplaintText: string;
  dutiesTitle: string;
  consentTitle: string;
  consentStatement: string;
  withdrawalConsequences: string;
  severabilityStatement: string;
  accountabilityStatement: string;
  duties: string[];
  rights: Record<string, string>;
}

export interface NoticeResponse {
  notice_version: string;
  legal_version: string;
  language: string;
  translation_status: string;
  heading: string;
  /** Full localised UI dictionary — the client renders from this. */
  strings: NoticeStrings;
  /** Languages with a full translation — the only options in the dropdown. */
  available_languages?: { code: string; label: string }[];
  /** Full Eighth-Schedule list, for transparency only. */
  eighth_schedule_languages?: { code: string; label: string }[];
  data_fiduciary: { name: string; role: string; dpo: DpoContact };
  items: NoticeItem[];
  cookie_categories: NoticeCookieCategory[];
  not_collected_without_consent: string[];
  rights: Record<string, string>;
  rights_descriptions?: Record<string, string>;
  board_complaint: BoardInfo;
  consent_statement: string;
  consent_label: string;
  severability_statement: string;
  withdrawal_consequences: string;
  accountability_statement: string;
  data_principal_duties: string[];
}

export interface PurposesResponse {
  notice_version: string;
  legal_version: string;
  purposes: ConsentPurpose[];
  dpo: DpoContact;
  board: BoardInfo;
}

export interface ConsentStateResponse {
  purposes: Record<string, boolean>;
  registry: { id: string; required: boolean; label: string }[];
  notice_version: string;
}

export interface AgeStatusResponse {
  isChild: boolean;
  guardianVerified: boolean;
  age: number | null;
  childLimit: number;
  telemetryDisabled: boolean;
}

export interface RightsCase {
  case_id: string;
  type: "access" | "correction" | "erasure" | "withdraw" | "grievance" | "nomination";
  status: "received" | "in_progress" | "completed" | "rejected" | "escalated";
  purpose_id: string | null;
  requested_at: string;
  sla_due_at: string;
  resolved_at?: string | null;
  resolution_notes?: string | null;
}

// ---- Domain 8: cookies / trackers ----
export type CookieCategoryId =
  | "strictly_functional"
  | "analytics"
  | "advertising"
  | "personalisation"
  | "social_media"
  | "consent_audit";

export interface CookieCategory {
  id: CookieCategoryId;
  label: string;
  description: string;
  purpose_id: string;
  lawful_basis: string;
  consent_required: boolean;
  /** True ⇒ always-on (cannot be toggled off). False/absent ⇒ toggleable. */
  locked?: boolean;
  default: boolean;
  vendor?: string;
  vendor_policy_url?: string;
  examples: string[];
}

export interface CookieStateResponse {
  notice_version: string;
  legal_version: string;
  subject_token: string;
  categories: CookieCategory[];
  preferences: Record<string, boolean>;
  last_action: string | null;
  /** Persisted adult age-assurance (Fourth Schedule) — renders the checkbox. */
  age_assured: boolean;
  /** The consent gate MUST load only these categories. */
  dispatch: string[];
  child_or_unknown_age: boolean;
  dpo: DpoContact;
  board: BoardInfo;
}

export interface CookieDecision {
  action: "accept_all" | "reject_all" | "custom";
  categories: Record<string, boolean>;
  /** Fourth Schedule: affirmatively confirming the visitor is not a child. */
  ageAssurance?: boolean;
}

export interface CookieConsentResult {
  evidence_hash: string;
  dispatch: string[];
  categories: Record<string, boolean>;
  /** True when only strictly-functional could be granted (unknown-age guest). */
  functional_only: boolean;
}

export interface PublicNominee {
  name: string;
  relationship: string | null;
  contact: string;
  share: string | null;
  status: "active" | "revoked" | "claimed";
  addedAt?: string;
  revokedAt?: string | null;
}

export interface GuardianConsentInput {
  relationship?: "parent" | "guardian" | "lawful_guardian";
  guardianName: string;
  guardianEmail?: string;
  guardianPhone?: string;
  verificationMethod:
    | "existing_reliable_identity"
    | "voluntarily_provided_identity"
    | "virtual_token"
    | "digital_locker";
}
