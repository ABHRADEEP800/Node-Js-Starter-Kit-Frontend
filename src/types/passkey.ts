// Mirrors the backend passkey output DTO (src/dto/passkey.dto.js/.ts) — only
// whitelisted fields are present; the public key & counter never leave the
// server.
export interface Passkey {
  _id: string;
  name: string;
  transports?: string[];
  credential_device_type?: "singleDevice" | "multiDevice";
  createdAt?: string;
  last_used_at?: string | null;
}

// The WebAuthn option/response shapes come from @simplewebauthn/browser types.
export type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
