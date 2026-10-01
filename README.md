# Starter Kit — Frontend (React + Vite)

The standalone SPA: React 19 · Vite · TypeScript · Tailwind CSS v4 · Redux Toolkit.
It talks to **one** Express backend (either `backend/` on `:5000` or `backnd-ts/`)
built from `VITE_API_*` in `.env`.

> Mirrors the client half of `next-starter-kit/`. A change here should be mirrored
> there (and vice-versa).

## Commands

```bash
npm install
cp .env.example .env      # if present; otherwise create it (see below)
npm run dev               # Vite dev server → http://localhost:5173
npm run build             # tsc -b && vite build (type errors fail the build)
npm run lint              # ESLint
npm run format            # Prettier (writes ./src)
npm run preview           # serve the production build
```

There is **no test framework** in this repo.

## Environment (`.env`)

| Var | Purpose |
| --- | --- |
| `VITE_API_HOST_URL` | Backend origin, e.g. `http://localhost:5000`. |
| `VITE_API_DEFAULT_PATH` | API prefix, normally `/api/v1`. |
| `VITE_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v3 **site** key (required on signup/login/forgot). |
| `VITE_PROJECT_NAME` | Brand name shown in the UI. |

`apiClient` builds URLs as `${VITE_API_HOST_URL}${VITE_API_DEFAULT_PATH}${endpoint}`.

## Features

### Authentication
- **Signup** with live username/email availability checks (debounced), age gate
  (`dateOfBirth`), consent gate, and under-18 guardian details.
- **Login** (username or email), "remember this device", forgot/reset password.
- **Email verification** and **TOTP 2FA** (authenticator QR + one-time backup
  codes you can view and download).
- **Passkeys** (WebAuthn) — register/manage in Security, sign in from Login.
- Session/device management: list active sessions, revoke one or all.

### Dashboards
- `/dashboard` — user area (Overview · Profile · Security).
- `/admin-dashboard` — admin console (see below).

### DPDP Privacy Center (`/privacy`) — user rights
- **Consent** — view/toggle each purpose (required + optional).
- **Cookie settings** — per-category tracker consent, plus *withdraw all
  non-essential tracking*.
- **My Data & Erasure** — s.11 access export, s.12 hard-delete, and a
  **Rule 6(c) audit-integrity self-check**.
- **Correction** — s.12 correct name/email (email change forces re-verification).
- **My Requests** — case list with SLA due dates; **Escalate to Board** (s.13).
- **Grievance** — raise a grievance (s.13).
- **Nomination** — add/edit/remove nominees (s.14); adding one opens a rights case.
- **Children & Guardian** — age status + record guardian consent (s.9 / Rule 10).
- `/privacy-notice` — the itemised privacy notice (public).
- `/nominee-claim` — public death/incapacity claim form (no account needed).

## Admin tabs (`/admin-dashboard`)

The admin console shares Overview · Profile · Security and adds four DPDP tabs.

| Tab | Route | What it's for |
| --- | --- | --- |
| **Rights inbox** | `/admin-dashboard/rights` | Review & action the rights/grievance inbox (ss.11–14). SLA stat cards (open / overdue / due ≤3 days), filter by type & status, update status, add resolution notes, record Board reference on escalation. |
| **Nominee claims** | `/admin-dashboard/nominee-claims` | Review death/incapacity claims (s.14). Filter pending/approved/rejected, **Approve**/**Reject** (approval locks the account to the nominee), inspect the Data Principal's nominee list. |
| **Breaches** | `/admin-dashboard/breaches` | Open a personal-data-breach incident and drive the Rule 7 workflow: auto severity, the **72-hour countdown**, generated Board first/72h report + data-principal notice drafts, and stage actions (mark sent / contained / extension / close). |
| **Compliance** | `/admin-dashboard/compliance` | Four registers: **Transfers** (s.16), **DPIA / SDF** (s.10), **Audit trail** (Rule 6(c) — list + re-verify hash chain), **Retention** (Rule 8 dry-run or execute). |

Admin-only access is enforced by `AuthLayout role="admin"`; every admin endpoint
is additionally gated server-side by strict RBAC.

## Layout

```
src/
  pages/            # route-level pages (Signup, PrivacyCenter, NomineeClaim, …)
  components/
    admin/          # AdminRightsCases, AdminNomineeClaims, AdminBreaches, AdminCompliance
    dashboard/      # DashbaordContainer (tabs), DashboardComponent, AdminDashboardComponent
    privacy/        # CookieConsent, Recaptcha gate, consent gate
    login/ register/ user/ header/ home/
  services/         # userService, privacyService, adminPrivacyService
  store/            # Redux (auth, theme)
  util/             # apiClient (CSRF + cookies), errors, consentGate, …
  hooks/            # useDebouncedAsyncCheck, useDebouncedValue
```

## Security notes
- Auth is **session/cookie-based** (httpOnly `session_id` / `device_id` /
  `_csrf_token`), not JWT. `apiClient` bootstraps CSRF and sends `X-CSRF-Token`
  on every non-GET request; a 401 dispatches logout.
- reCAPTCHA is only loaded after cookie consent for the `captcha` tracker.
- Dark mode is a `dark` class on `<html>`, applied pre-paint via `index.html`.
