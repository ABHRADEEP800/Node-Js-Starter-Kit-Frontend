import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ShieldCheckIcon, TrashIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import PrivacyService from "../services/privacyService";
import type {
  ConsentPurpose,
  RightsCase,
  CookieCategory,
  PublicNominee,
  AgeStatusResponse,
} from "../types/dpdp";
import { getErrorMessage } from "../util/errors";
import { store } from "../store/store";
import { logout } from "../store/auth/authSlice";
import { Button, Loading } from "../components";

type Tab =
  | "consent"
  | "cookies"
  | "data"
  | "correct"
  | "requests"
  | "grievance"
  | "nomination"
  | "children";

const TABS: { id: Tab; label: string }[] = [
  { id: "consent", label: "Consent" },
  { id: "cookies", label: "Cookie settings" },
  { id: "data", label: "My Data & Erasure" },
  { id: "correct", label: "Correction" },
  { id: "requests", label: "My Requests" },
  { id: "grievance", label: "Grievance" },
  { id: "nomination", label: "Nomination" },
  { id: "children", label: "Children & Guardian" },
];

function PrivacyCenter() {
  const [tab, setTab] = useState<Tab>("consent");
  const [purposes, setPurposes] = useState<ConsentPurpose[]>([]);
  const [consentState, setConsentState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [myData, setMyData] = useState<Record<string, unknown> | null>(null);
  const [cases, setCases] = useState<RightsCase[]>([]);
  const [grievance, setGrievance] = useState({ subject: "", message: "" });
  const [nominee, setNominee] = useState({
    name: "",
    relationship: "",
    email: "",
    share: "",
  });
  const [nomineesList, setNomineesList] = useState<PublicNominee[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editNominee, setEditNominee] = useState({
    name: "",
    relationship: "",
    email: "",
    share: "",
  });

  // Domain 8: inline cookie/tracker preferences.
  const [cookieCategories, setCookieCategories] = useState<CookieCategory[]>([]);
  const [cookiePrefs, setCookiePrefs] = useState<Record<string, boolean>>({});
  const [cookieAgeAssured, setCookieAgeAssured] = useState(false);

  // s. 12 — correction form.
  const [correction, setCorrection] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Rule 6(c) — self-service audit-chain integrity result.
  const [auditResult, setAuditResult] = useState<{
    valid: boolean;
    count: number;
  } | null>(null);
  const [verifyingAudit, setVerifyingAudit] = useState(false);

  // s. 9 / Rule 10 — child account + guardian consent.
  const [ageStatus, setAgeStatus] = useState<AgeStatusResponse | null>(null);
  const [guardianForm, setGuardianForm] = useState({
    relationship: "parent" as "parent" | "guardian" | "lawful_guardian",
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
    verificationMethod: "voluntarily_provided_identity" as
      | "existing_reliable_identity"
      | "voluntarily_provided_identity"
      | "virtual_token"
      | "digital_locker",
  });

  const refreshCookies = async () => {
    const res = await PrivacyService.getCookieState();
    setCookieCategories(res.data.categories);
    setCookiePrefs(res.data.preferences);
    setCookieAgeAssured(res.data.age_assured === true);
  };

  const toggleCookie = async (id: string, on: boolean) => {
    try {
      setBusy(true);
      const next = { ...cookiePrefs, [id]: on };
      await PrivacyService.saveCookieConsent({
        action: "custom",
        categories: next,
        ageAssurance: cookieAgeAssured,
      });
      await refreshCookies();
      toast.success(on ? "Enabled" : "Disabled");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update cookie settings"));
    } finally {
      setBusy(false);
    }
  };

  const refreshConsent = async () => {
    const [p, c] = await Promise.all([
      PrivacyService.getPurposes(),
      PrivacyService.getConsent(),
    ]);
    setPurposes(p.data.purposes);
    setConsentState(c.data.purposes);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refreshConsent();
      } catch {
        toast.error("Failed to load privacy settings");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggleConsent = async (purposeId: string, granted: boolean) => {
    try {
      setBusy(true);
      if (granted) {
        await PrivacyService.grantConsent([purposeId]);
        toast.success("Consent recorded");
      } else {
        await PrivacyService.withdrawConsent(purposeId);
        toast.success("Consent withdrawn — processing stopped");
      }
      await refreshConsent();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update consent"));
    } finally {
      setBusy(false);
    }
  };

  const loadData = async () => {
    try {
      setBusy(true);
      const res = await PrivacyService.getMyData();
      setMyData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to fetch your data"));
    } finally {
      setBusy(false);
    }
  };

  const loadCases = async () => {
    try {
      const res = await PrivacyService.listCases();
      setCases(res.data.cases);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load requests"));
    }
  };

  const loadNominees = async () => {
    try {
      const res = await PrivacyService.listNominees();
      setNomineesList(res.data.nominees);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load nominees"));
    }
  }

  const loadAgeStatus = async () => {
    try {
      const res = await PrivacyService.getAgeStatus();
      setAgeStatus(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load age status"));
    }
  };

  useEffect(() => {
    (async () => {
      if (tab === "data") await loadData();
      if (tab === "requests") await loadCases();
      if (tab === "cookies") await refreshCookies();
      if (tab === "nomination") await loadNominees();
      if (tab === "children") await loadAgeStatus();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      await PrivacyService.correctMyData({
        ...(correction.firstName ? { firstName: correction.firstName } : {}),
        ...(correction.lastName ? { lastName: correction.lastName } : {}),
        ...(correction.email ? { email: correction.email } : {}),
      });
      toast.success("Correction recorded (s. 12)");
      setCorrection({ firstName: "", lastName: "", email: "" });
      await loadData();
      await loadCases();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit correction"));
    } finally {
      setBusy(false);
    }
  };

  const escalate = async (caseId: string) => {
    if (
      !window.confirm(
        `Escalate case ${caseId} to the Data Protection Board (s. 13)? Only do this after exhausting our grievance mechanism.`
      )
    )
      return;
    try {
      setBusy(true);
      await PrivacyService.escalateGrievance(caseId);
      toast.success("Grievance escalated to the Board");
      await loadCases();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to escalate"));
    } finally {
      setBusy(false);
    }
  };

  const withdrawCookies = async () => {
    if (
      !window.confirm(
        "Withdraw all non-essential cookie consent and stop tracking now?"
      )
    )
      return;
    try {
      setBusy(true);
      await PrivacyService.withdrawCookieConsent("all");
      await refreshCookies();
      toast.success("Non-essential tracking withdrawn");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to withdraw cookie consent"));
    } finally {
      setBusy(false);
    }
  };

  const verifyAudit = async () => {
    setVerifyingAudit(true);
    try {
      const res = await PrivacyService.verifyAuditIntegrity();
      setAuditResult({ valid: res.data.valid, count: res.data.count });
      toast.success(
        res.data.valid ? "Audit trail verified" : "Audit trail verification FAILED"
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to verify audit trail"));
    } finally {
      setVerifyingAudit(false);
    }
  };

  const submitGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      await PrivacyService.submitGuardianConsent({
        relationship: guardianForm.relationship,
        guardianName: guardianForm.guardianName,
        guardianEmail: guardianForm.guardianEmail || undefined,
        guardianPhone: guardianForm.guardianPhone || undefined,
        verificationMethod: guardianForm.verificationMethod,
      });
      toast.success("Guardian consent recorded (Rule 10)");
      setGuardianForm({
        relationship: "parent",
        guardianName: "",
        guardianEmail: "",
        guardianPhone: "",
        verificationMethod: "voluntarily_provided_identity",
      });
      await loadAgeStatus();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to record guardian consent"));
    } finally {
      setBusy(false);
    }
  };

  const startEditNominee = (index: number, n: PublicNominee) => {
    setEditingIndex(index);
    setEditNominee({
      name: n.name,
      relationship: n.relationship ?? "",
      email: "",
      share: n.share ?? "",
    });
  };

  const saveNomineeEdit = async (index: number) => {
    try {
      setBusy(true);
      await PrivacyService.editNominee(index, {
        name: editNominee.name,
        relationship: editNominee.relationship,
        share: editNominee.share,
        ...(editNominee.email ? { email: editNominee.email } : {}),
      });
      setEditingIndex(null);
      toast.success("Nominee updated");
      await loadNominees();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update nominee"));
    } finally {
      setBusy(false);
    }
  };

  const removeNomineeAt = async (index: number) => {
    if (!window.confirm("Remove this nominee?")) return;
    try {
      setBusy(true);
      await PrivacyService.removeNominee(index);
      toast.success("Nominee removed");
      await loadNominees();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove nominee"));
    } finally {
      setBusy(false);
    }
  };

  const requestErasure = async () => {
    if (
      !window.confirm(
        "This will permanently erase your account and personal data (hard delete under the DPDP Act s. 12). Continue?"
      )
    )
      return;
    try {
      setBusy(true);
      await PrivacyService.eraseMyData();
      // Clear local auth state so no authenticated call is attempted with the
      // now-deleted session (avoids a confusing "Session expired" toast).
      store.dispatch(logout());
      toast.success("Your data has been erased");
      window.location.href = "/";
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to erase your data"));
    } finally {
      setBusy(false);
    }
  };

  const submitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      const res = await PrivacyService.raiseGrievance(
        grievance.subject,
        grievance.message
      );
      toast.success(`Grievance ${res.data.case_id} received`);
      setGrievance({ subject: "", message: "" });
      loadCases();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit grievance"));
    } finally {
      setBusy(false);
    }
  };

  const submitNominee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      // Record the whole active list via the s.14 nomination endpoint, which
      // also opens a rights case for the nomination (SLA + audit trail).
      const active = nomineesList.filter((n) => n.status !== "revoked");
      const payload = [
        ...active.map((n) => ({
          name: n.name,
          relationship: n.relationship ?? undefined,
          share: n.share ?? undefined,
        })),
        { ...nominee },
      ];
      await PrivacyService.nominate(payload);
      toast.success("Nominee added");
      setNominee({ name: "", relationship: "", email: "", share: "" });
      await loadNominees();
      await loadCases();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to record nominee"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="bg-gray-50 px-4 py-8 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheckIcon className="h-7 w-7 text-brand-600 dark:text-brand-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Privacy Center
          </h1>
        </div>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Exercise your rights under the DPDP Act 2023. See the{" "}
          <Link to="/privacy-notice" className="text-brand-600 underline dark:text-brand-400">
            Privacy Notice
          </Link>
          . We target resolution within 30 days (Rule 14).
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          {tab === "consent" && (
            <div className="space-y-4">
              {purposes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {p.label}{" "}
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        ({p.required ? "required" : "optional"})
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {p.description}
                    </p>
                    <p className="mt-1 text-xs font-medium">
                      {consentState[p.id]
                        ? "Consented"
                        : p.required
                          ? "Not consented"
                          : "Off"}
                    </p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={busy}
                      checked={!!consentState[p.id]}
                      onChange={(e) => toggleConsent(p.id, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-xs text-gray-500">Allow</span>
                  </label>
                </div>
              ))}
              {consentState["account"] === false && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  Withdrawing the account purpose stops processing and schedules
                  erasure (s. 8(7)).
                </p>
              )}
            </div>
          )}

          {tab === "cookies" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cookie &amp; tracker settings
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Analytics, advertising, personalisation and social embeds are
                separate consents, off by default (DPDP Act 2023 — no "strictly
                necessary" exemption). Your choice takes effect immediately and
                tracking stops.
              </p>
              <div className="mt-4 space-y-3">
                {cookieCategories.map((c) => {
                  const locked = !c.consent_required;
                  return (
                    <div
                      key={c.id}
                      className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {c.label}{" "}
                          {locked && (
                            <span className="ml-1 text-xs font-normal text-gray-500">
                              (always on)
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {c.description}
                        </p>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={locked || busy}
                          checked={locked ? true : !!cookiePrefs[c.id]}
                          onChange={(e) => toggleCookie(c.id, e.target.checked)}
                          className="h-4 w-4"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("dpdp:open-cookie-settings"))
                  }
                  className="text-xs font-medium text-brand-600 underline dark:text-brand-400"
                >
                  Open the full cookie panel
                </button>
                <button
                  onClick={withdrawCookies}
                  disabled={busy}
                  className="text-xs font-medium text-red-600 underline disabled:opacity-50 dark:text-red-400"
                >
                  Withdraw all non-essential tracking
                </button>
              </div>
            </div>
          )}

          {tab === "data" && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <DocumentTextIcon className="h-5 w-5" /> Your data (s. 11)
                </h2>
                <button
                  onClick={loadData}
                  className="text-xs font-medium text-brand-600 dark:text-brand-400"
                >
                  Refresh
                </button>
              </div>
              {myData ? (
                <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {JSON.stringify(myData, null, 2)}
                </pre>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Loading…</p>
              )}

              <div className="mt-6 rounded-lg border border-red-200 p-4 dark:border-red-900/50">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
                  <TrashIcon className="h-4 w-4" /> Erase my data (s. 12)
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Permanently deletes your account and personal data (hard delete),
                  unless a legal retention obligation applies.
                </p>
                <button
                  onClick={requestErasure}
                  disabled={busy}
                  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Request erasure
                </button>
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <ShieldCheckIcon className="h-4 w-4" /> Verify audit integrity
                  (Rule 6(c))
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Confirm that the audit trail of access to your data has not been
                  tampered with (tamper-evident hash chain).
                </p>
                <button
                  onClick={verifyAudit}
                  disabled={verifyingAudit}
                  className="mt-3 rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-950/40"
                >
                  {verifyingAudit ? "Verifying…" : "Verify audit trail"}
                </button>
                {auditResult && (
                  <p
                    className={`mt-2 text-xs font-medium ${
                      auditResult.valid
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {auditResult.valid
                      ? `Intact — ${auditResult.count} entries verified`
                      : "Verification failed — possible tampering"}
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === "correct" && (
            <form onSubmit={submitCorrection} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Correct your data (s. 12)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ask us to correct or complete inaccurate personal data. Changing
                your email requires re-verification and signs you out of other
                devices.
              </p>
              <input
                placeholder="First name"
                value={correction.firstName}
                onChange={(e) =>
                  setCorrection({ ...correction, firstName: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <input
                placeholder="Last name"
                value={correction.lastName}
                onChange={(e) =>
                  setCorrection({ ...correction, lastName: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="email"
                placeholder="Email (new address)"
                value={correction.email}
                onChange={(e) =>
                  setCorrection({ ...correction, email: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <Button
                type="submit"
                isLoading={busy}
                disabled={busy || (!correction.firstName && !correction.lastName && !correction.email)}
              >
                Submit correction
              </Button>
            </form>
          )}

          {tab === "requests" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your requests
              </h2>
              {cases.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No requests yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {cases.map((c) => (
                    <div
                      key={c.case_id}
                      className="rounded-lg border border-gray-100 p-3 text-sm dark:border-gray-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium capitalize text-gray-900 dark:text-white">
                            {c.type} · {c.case_id}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Status: {c.status} · SLA due{" "}
                            {new Date(c.sla_due_at).toLocaleDateString()}
                          </p>
                        </div>
                        {c.type === "grievance" &&
                          c.status !== "escalated" &&
                          c.status !== "completed" && (
                            <button
                              onClick={() => escalate(c.case_id)}
                              disabled={busy}
                              className="shrink-0 rounded-md border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950/40"
                            >
                              Escalate to Board
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "grievance" && (
            <form onSubmit={submitGrievance} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Raise a grievance (s. 13)
              </h2>
              <input
                required
                placeholder="Subject"
                value={grievance.subject}
                onChange={(e) =>
                  setGrievance({ ...grievance, subject: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <textarea
                required
                rows={4}
                placeholder="Describe your grievance"
                value={grievance.message}
                onChange={(e) =>
                  setGrievance({ ...grievance, message: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <Button type="submit" isLoading={busy} disabled={busy}>
                Submit grievance
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You must exhaust this mechanism before approaching the Data
                Protection Board (s. 13).
              </p>
            </form>
          )}

          {tab === "nomination" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your nominees (s. 14)
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  A nominee may exercise your data rights if you die or become
                  incapacitated. Names and contacts are stored encrypted; here they
                  are shown masked.
                </p>
              </div>

              {/* Existing nominees: edit / remove */}
              {nomineesList.filter((n) => n.status !== "revoked").length > 0 && (
                <ul className="space-y-2">
                  {nomineesList
                    .map((n, i) => ({ n, i }))
                    .filter(({ n }) => n.status !== "revoked")
                    .map(({ n, i }) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                      >
                        <div className="min-w-0">
                          {editingIndex === i ? (
                            <div className="space-y-2">
                              <input
                                value={editNominee.name}
                                onChange={(e) =>
                                  setEditNominee({ ...editNominee, name: e.target.value })
                                }
                                placeholder="Name"
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                              <input
                                value={editNominee.relationship}
                                onChange={(e) =>
                                  setEditNominee({ ...editNominee, relationship: e.target.value })
                                }
                                placeholder="Relationship"
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                              <input
                                value={editNominee.email}
                                onChange={(e) =>
                                  setEditNominee({ ...editNominee, email: e.target.value })
                                }
                                placeholder="Email (optional)"
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                              <input
                                value={editNominee.share}
                                onChange={(e) =>
                                  setEditNominee({ ...editNominee, share: e.target.value })
                                }
                                placeholder="Share (e.g. 50%)"
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {n.name}
                                {n.status === "claimed" && (
                                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                    claimed
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {n.relationship} · {n.contact}
                                {n.share ? ` · ${n.share}` : ""}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {editingIndex === i ? (
                            <>
                              <button
                                onClick={() => saveNomineeEdit(i)}
                                disabled={busy}
                                className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingIndex(null)}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 dark:border-gray-600 dark:text-gray-300"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditNominee(i, n)}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => removeNomineeAt(i)}
                                disabled={busy}
                                className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              )}

              {/* Add a nominee */}
              {nomineesList.filter((n) => n.status !== "revoked").length < 5 && (
                <form onSubmit={submitNominee} className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Add a nominee
                  </p>
                  <input
                    required
                    placeholder="Nominee full name"
                    value={nominee.name}
                    onChange={(e) => setNominee({ ...nominee, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    placeholder="Relationship"
                    value={nominee.relationship}
                    onChange={(e) => setNominee({ ...nominee, relationship: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    placeholder="Email (optional)"
                    value={nominee.email}
                    onChange={(e) => setNominee({ ...nominee, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    placeholder="Share (e.g. 50%)"
                    value={nominee.share}
                    onChange={(e) => setNominee({ ...nominee, share: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <Button type="submit" isLoading={busy} disabled={busy}>
                    Add nominee
                  </Button>
                </form>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                A nominee can claim on death/incapacity from the{" "}
                <Link to="/nominee-claim" className="text-brand-600 underline dark:text-brand-400">
                  nominee claim page
                </Link>
                .
              </p>
            </div>
          )}

          {tab === "children" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Children &amp; guardian consent (s. 9, Rule 10)
              </h2>

              {ageStatus ? (
                <div className="rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-700">
                  <p className="text-gray-700 dark:text-gray-200">
                    Age status:{" "}
                    <span className="font-semibold">
                      {ageStatus.isChild ? "Child (under 18)" : "Adult"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Guardian consent:{" "}
                    {ageStatus.guardianVerified ? "verified" : "not recorded"} ·
                    Behavioural tracking / targeted ads:{" "}
                    {ageStatus.telemetryDisabled ? "disabled" : "enabled"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Loading…</p>
              )}

              {ageStatus?.isChild ? (
                <form onSubmit={submitGuardian} className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Record / refresh guardian consent
                  </p>
                  <select
                    value={guardianForm.relationship}
                    onChange={(e) =>
                      setGuardianForm({
                        ...guardianForm,
                        relationship: e.target.value as typeof guardianForm.relationship,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="parent">Parent</option>
                    <option value="guardian">Guardian</option>
                    <option value="lawful_guardian">Lawful guardian</option>
                  </select>
                  <input
                    required
                    placeholder="Guardian full name"
                    value={guardianForm.guardianName}
                    onChange={(e) =>
                      setGuardianForm({ ...guardianForm, guardianName: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="email"
                    placeholder="Guardian email (optional)"
                    value={guardianForm.guardianEmail}
                    onChange={(e) =>
                      setGuardianForm({ ...guardianForm, guardianEmail: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    placeholder="Guardian phone (optional)"
                    value={guardianForm.guardianPhone}
                    onChange={(e) =>
                      setGuardianForm({ ...guardianForm, guardianPhone: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <select
                    value={guardianForm.verificationMethod}
                    onChange={(e) =>
                      setGuardianForm({
                        ...guardianForm,
                        verificationMethod: e.target.value as typeof guardianForm.verificationMethod,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="existing_reliable_identity">Existing reliable identity</option>
                    <option value="voluntarily_provided_identity">Voluntarily provided identity</option>
                    <option value="virtual_token">Virtual token</option>
                    <option value="digital_locker">Digital Locker</option>
                  </select>
                  <Button type="submit" isLoading={busy} disabled={busy || !guardianForm.guardianName}>
                    Record guardian consent
                  </Button>
                </form>
              ) : (
                <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                  Guardian consent only applies to accounts belonging to children
                  under 18.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PrivacyCenter;
