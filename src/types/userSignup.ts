export type UserSignup = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  cnfPassword?: string;
  recaptchaToken?: string | undefined;
  // ---- DPDP Act 2023 ----
  /** ISO date (YYYY-MM-DD) used for the s. 9 age gate. */
  dateOfBirth: string;
  /** Explicit opt-in to the itemised notice (must be true). */
  consentAccepted: boolean;
  noticeVersion: string;
  language?: string;
  /** Optional purposes the user separately opted into (none by default). */
  optionalConsent?: string[];
  /** Required only when the user is under 18 (verifiable parental consent). */
  guardian?: {
    relationship?: "parent" | "guardian" | "lawful_guardian";
    name: string;
    email?: string;
    phone?: string;
    verificationMethod?:
      | "existing_reliable_identity"
      | "voluntarily_provided_identity"
      | "virtual_token"
      | "digital_locker";
  };
};
