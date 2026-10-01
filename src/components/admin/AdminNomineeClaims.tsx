import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import adminPrivacyService from "../../services/adminPrivacyService";
import type {
  NomineeClaim,
  NomineeClaimStatus,
  AdminNomineeView,
} from "../../services/adminPrivacyService";
import { getErrorMessage } from "../../util/errors";
import { Button, Loading } from "../";

const FILTERS: { id: NomineeClaimStatus | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

const STATUS_STYLE: Record<NomineeClaimStatus, string> = {
  pending:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300",
  approved:
    "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/40 dark:text-green-300",
  rejected:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminNomineeClaims() {
  const [filter, setFilter] = useState<NomineeClaimStatus | "all">("pending");
  const [claims, setClaims] = useState<NomineeClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nomineesFor, setNomineesFor] = useState<string | null>(null);
  const [nomineeList, setNomineeList] = useState<AdminNomineeView[]>([]);
  // Guards against a stale response overwriting a newer claim's nominee list.
  const nomineeReqId = useRef(0);

  const load = async (status: NomineeClaimStatus | "all") => {
    setLoading(true);
    try {
      const res = await adminPrivacyService.listNomineeClaims(
        status === "all" ? undefined : status
      );
      setClaims(res.data.claims ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load nominee claims"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await adminPrivacyService.listNomineeClaims(
          filter === "all" ? undefined : filter
        );
        if (active) setClaims(res.data.claims ?? []);
      } catch (err) {
        if (active)
          toast.error(getErrorMessage(err, "Failed to load nominee claims"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [filter]);

  const viewNominees = async (claim: NomineeClaim) => {
    if (nomineesFor === claim.claim_id) {
      setNomineesFor(null);
      return;
    }
    setNomineesFor(claim.claim_id);
    setNomineeList([]);
    const reqId = ++nomineeReqId.current;
    try {
      const res = await adminPrivacyService.getNominees(claim.data_principal_id);
      // Only apply if this is still the latest request (rapid toggling).
      if (reqId !== nomineeReqId.current) return;
      setNomineeList(res.data.nominees ?? []);
    } catch (err) {
      if (reqId !== nomineeReqId.current) return;
      toast.error(getErrorMessage(err, "Failed to load the DP's nominees"));
    }
  };

  const decide = async (claim: NomineeClaim, decision: "approve" | "reject") => {
    const verb = decision === "approve" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${verb} claim ${claim.claim_id}?`)) {
      return;
    }
    setBusyId(claim.claim_id);
    try {
      await adminPrivacyService.decideNomineeClaim(claim.claim_id, decision);
      toast.success(`Claim ${claim.claim_id} ${decision}d`);
      await load(filter);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to decide the claim"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Nominee claims
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review death/incapacity claims filed by nominees (DPDP s. 14). On
          approval the account is locked to the approved nominee.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.id
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loading />
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <UserGroupIcon className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            No {filter === "all" ? "" : filter} claims
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Claims submitted by nominees will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div
              key={claim._id ?? claim.claim_id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      {claim.claim_id}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[claim.status]}`}
                    >
                      {claim.status}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {claim.basis}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <Field label="Claimant" value={claim.claimant_name || "—"} />
                    <Field
                      label="Contact"
                      value={claim.claimant_contact || "—"}
                    />
                    <Field
                      label="Relationship"
                      value={claim.claimant_relationship || "—"}
                    />
                    <Field
                      label="Nominee index"
                      value={String(claim.nominee_index)}
                    />
                    <Field
                      label="Filed"
                      value={formatDateTime(claim.requested_at)}
                    />
                    <Field
                      label="Decided"
                      value={formatDateTime(claim.decided_at)}
                    />
                  </dl>
                  {claim.note && (
                    <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                      {claim.note}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => viewNominees(claim)}
                    className="mt-3 text-xs font-medium text-brand-600 underline dark:text-brand-400"
                  >
                    {nomineesFor === claim.claim_id ? "Hide nominees" : "View DP's nominees"}
                  </button>

                  {nomineesFor === claim.claim_id && (
                    <div className="mt-2 space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
                      {nomineeList.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Loading / no nominees on record…
                        </p>
                      ) : (
                        nomineeList.map((n, i) => (
                          <div
                            key={i}
                            className="flex flex-wrap items-center gap-2 text-xs text-gray-700 dark:text-gray-200"
                          >
                            <span className="font-medium">{n.name ?? "—"}</span>
                            <span className="text-gray-400">·</span>
                            <span>{n.relationship ?? "—"}</span>
                            <span className="text-gray-400">·</span>
                            <span className="font-mono">{n.contact ?? "—"}</span>
                            {n.share && <span className="text-gray-400">· {n.share}</span>}
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                n.status === "active"
                                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                                  : n.status === "claimed"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {n.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {claim.status === "pending" && (
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <Button
                      type="button"
                      onClick={() => decide(claim, "approve")}
                      isLoading={busyId === claim.claim_id}
                      disabled={busyId !== null}
                      className="flex-1 !py-2 sm:w-32"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve
                      </span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => decide(claim, "reject")}
                      disabled={busyId !== null}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60 sm:w-32 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}
                {claim.status !== "pending" && claim.decision_note && (
                  <p className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 sm:max-w-[14rem] dark:border-gray-700 dark:text-gray-400">
                    {claim.decision_note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-gray-700 dark:text-gray-200">{value}</dd>
    </div>
  );
}

export default AdminNomineeClaims;
