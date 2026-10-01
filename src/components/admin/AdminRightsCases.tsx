import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  InboxIcon,
  ArrowPathIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import adminPrivacyService from "../../services/adminPrivacyService";
import type {
  AdminRightsCase,
  RightsCaseStatus,
  RightsCaseType,
  SlaCase,
} from "../../services/adminPrivacyService";
import { getErrorMessage } from "../../util/errors";
import { Loading } from "../";

const TYPES: { id: RightsCaseType | "all"; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "access", label: "Access" },
  { id: "correction", label: "Correction" },
  { id: "erasure", label: "Erasure" },
  { id: "withdraw", label: "Withdraw" },
  { id: "grievance", label: "Grievance" },
  { id: "nomination", label: "Nomination" },
];

const STATUSES: { id: RightsCaseStatus | "all"; label: string }[] = [
  { id: "all", label: "All statuses" },
  { id: "received", label: "Received" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Rejected" },
  { id: "escalated", label: "Escalated" },
];

const STATUS_STYLE: Record<RightsCaseStatus, string> = {
  received:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  in_progress:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  completed:
    "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  rejected:
    "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  escalated:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};

const NEXT_STATUSES: RightsCaseStatus[] = [
  "received",
  "in_progress",
  "completed",
  "rejected",
  "escalated",
];

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

function slaInfo(c: AdminRightsCase): { label: string; tone: string } {
  if (c.resolved_at) return { label: "Resolved", tone: "text-gray-500" };
  const due = new Date(c.sla_due_at).getTime();
  if (Number.isNaN(due)) return { label: "—", tone: "text-gray-400" };
  const diff = due - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0)
    return { label: `${Math.abs(days)}d overdue`, tone: "text-red-600 dark:text-red-400" };
  if (days <= 3)
    return { label: `${days}d left`, tone: "text-amber-600 dark:text-amber-400" };
  return { label: `${days}d left`, tone: "text-gray-500 dark:text-gray-400" };
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function AdminRightsCases() {
  const [type, setType] = useState<RightsCaseType | "all">("all");
  const [status, setStatus] = useState<RightsCaseStatus | "all">("all");
  const [cases, setCases] = useState<AdminRightsCase[]>([]);
  const [sla, setSla] = useState<SlaCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCase, setOpenCase] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    status: RightsCaseStatus;
    resolution_notes: string;
    board_reference: string;
  }>({ status: "in_progress", resolution_notes: "", board_reference: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [res, slaRes] = await Promise.all([
        adminPrivacyService.listRightsCases({
          type: type === "all" ? undefined : type,
          status: status === "all" ? undefined : status,
        }),
        adminPrivacyService.getSlaDashboard().catch(() => null),
      ]);
      setCases(res.data.cases ?? []);
      if (slaRes) setSla(slaRes.data.cases ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load rights cases"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [res, slaRes] = await Promise.all([
          adminPrivacyService.listRightsCases({
            type: type === "all" ? undefined : type,
            status: status === "all" ? undefined : status,
          }),
          adminPrivacyService.getSlaDashboard().catch(() => null),
        ]);
        if (active) {
          setCases(res.data.cases ?? []);
          if (slaRes) setSla(slaRes.data.cases ?? []);
        }
      } catch (err) {
        if (active) toast.error(getErrorMessage(err, "Failed to load rights cases"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [type, status]);

  const openEditor = (c: AdminRightsCase) => {
    if (openCase === c.case_id) {
      setOpenCase(null);
      return;
    }
    setOpenCase(c.case_id);
    setDraft({
      status: c.status,
      resolution_notes: c.resolution_notes ?? "",
      board_reference: c.escalation?.board_reference ?? "",
    });
  };

  const save = async (c: AdminRightsCase) => {
    setBusyId(c.case_id);
    try {
      await adminPrivacyService.updateRightsCase(c.case_id, {
        status: draft.status,
        resolution_notes: draft.resolution_notes,
        ...(draft.status === "escalated"
          ? { board_reference: draft.board_reference }
          : {}),
      });
      toast.success(`Case ${c.case_id} updated`);
      setOpenCase(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update case"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Rights &amp; grievance inbox
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Act on access, correction, erasure, withdrawal, grievance and
            nomination requests (DPDP ss. 11–14, Rule 14 SLA).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowPathIcon className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as RightsCaseType | "all")}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          {TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as RightsCaseStatus | "all")}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {sla.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <Stat label="Open cases" value={sla.length} tone="text-gray-900 dark:text-white" />
          <Stat
            label="Overdue (Rule 14)"
            value={sla.filter((s) => s.overdue).length}
            tone={
              sla.some((s) => s.overdue)
                ? "text-red-600 dark:text-red-400"
                : "text-gray-900 dark:text-white"
            }
          />
          <Stat
            label="Due ≤ 3 days"
            value={sla.filter((s) => !s.overdue && s.days_left <= 3).length}
            tone="text-amber-600 dark:text-amber-400"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loading />
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <InboxIcon className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            No cases match these filters
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Data-principal requests and grievances will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const sla = slaInfo(c);
            const name =
              [c.user_id?.firstName, c.user_id?.lastName]
                .filter(Boolean)
                .join(" ") ||
              c.user_id?.username ||
              "Unknown user";
            const isOpen = openCase === c.case_id;
            return (
              <div
                key={c.case_id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <button
                  type="button"
                  onClick={() => openEditor(c)}
                  className="flex w-full items-center gap-3 p-5 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                    <InboxIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {c.case_id}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {c.type}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[c.status]}`}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      {name}
                      {c.user_id?.email ? ` · ${c.user_id.email}` : ""} · filed{" "}
                      {formatDateTime(c.requested_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`text-xs font-semibold ${sla.tone}`}>
                      {sla.label}
                    </span>
                    <ChevronDownIcon
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200 p-5 dark:border-gray-800">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Status
                        <select
                          value={draft.status}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              status: e.target.value as RightsCaseStatus,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-700 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                          {NEXT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>

                      {draft.status === "escalated" && (
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Board reference
                          <input
                            type="text"
                            value={draft.board_reference}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                board_reference: e.target.value,
                              })
                            }
                            placeholder="Board ref / docket no."
                            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-700 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                          />
                        </label>
                      )}
                    </div>

                    <label className="mt-3 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Resolution notes
                      <textarea
                        rows={3}
                        value={draft.resolution_notes}
                        onChange={(e) =>
                          setDraft({ ...draft, resolution_notes: e.target.value })
                        }
                        placeholder="What was done to resolve this request…"
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-700 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                    </label>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenCase(null)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void save(c)}
                        disabled={busyId !== null}
                        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                      >
                        {busyId === c.case_id ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminRightsCases;
