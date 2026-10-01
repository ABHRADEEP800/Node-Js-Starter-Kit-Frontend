import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowPathIcon,
  ClockIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import adminPrivacyService from "../../services/adminPrivacyService";
import type {
  BreachIncident,
  BreachSeverity,
  BreachStage,
  BreachDrafts,
} from "../../services/adminPrivacyService";
import { getErrorMessage } from "../../util/errors";
import { Button, Loading } from "../";

const SEVERITY_STYLE: Record<BreachSeverity, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  high: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  critical: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

const emptyForm = {
  title: "",
  description: "",
  nature: "",
  extent: "",
  location: "",
  likely_impact: "",
  cause: "",
  affectedCount: 0,
  involvesChildren: false,
  confidentiality: false,
  integrity: false,
  availability: false,
};

const STAGE_LABELS: Record<BreachStage, string> = {
  board_first: "Mark Board first report sent",
  board_detailed: "Mark Board 72h report sent",
  data_principals: "Mark data principals notified",
  contained: "Mark contained",
  extension: "Record Board extension",
  close: "Close incident",
};

function fmt(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function hoursLabel(h: number | null, overdue: boolean): { text: string; tone: string } {
  if (h === null) return { text: "—", tone: "text-gray-400" };
  if (overdue)
    return { text: `${Math.abs(h)}h overdue`, tone: "text-red-600 dark:text-red-400" };
  return { text: `${h}h left`, tone: h <= 12 ? "text-amber-600 dark:text-amber-400" : "text-gray-500" };
}

function AdminBreaches() {
  const [incidents, setIncidents] = useState<BreachIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<BreachDrafts | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminPrivacyService.listBreaches();
      setIncidents(res.data.incidents ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load incidents"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await adminPrivacyService.listBreaches();
        if (active) setIncidents(res.data.incidents ?? []);
      } catch (err) {
        if (active) toast.error(getErrorMessage(err, "Failed to load incidents"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const openDrafts = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    setDrafts(null);
    try {
      const res = await adminPrivacyService.getBreachDrafts(id);
      setDrafts(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load drafts"));
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminPrivacyService.createBreach({
        title: form.title,
        description: form.description,
        nature: form.nature || undefined,
        extent: form.extent || undefined,
        location: form.location || undefined,
        likely_impact: form.likely_impact || undefined,
        cause: form.cause || undefined,
        affectedCount: Number(form.affectedCount) || 0,
        involvesChildren: form.involvesChildren,
        impact: {
          confidentiality: form.confidentiality,
          integrity: form.integrity,
          availability: form.availability,
        },
      });
      toast.success("Incident opened");
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to open incident"));
    } finally {
      setSaving(false);
    }
  };

  const advance = async (id: string, stage: BreachStage) => {
    setBusyId(id);
    try {
      await adminPrivacyService.notifyBreach(id, stage);
      toast.success("Incident updated");
      await load();
      if (openId === id) {
        const res = await adminPrivacyService.getBreachDrafts(id);
        setDrafts(res.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update incident"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Breach workflow
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Open incidents and track the Rule 7 Board reports + data-principal
            notices against the 72-hour clock (DPDP s. 8(6)).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Refresh
          </button>
          <Button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="!w-auto !py-1.5 !text-xs"
          >
            <span className="inline-flex items-center gap-1.5">
              <PlusIcon className="h-4 w-4" />
              Open incident
            </span>
          </Button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={create}
          className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
            <Text label="Affected count" type="number" value={String(form.affectedCount)} onChange={(v) => setForm({ ...form, affectedCount: Number(v) })} />
          </div>
          <Area label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} required />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text label="Nature" value={form.nature} onChange={(v) => setForm({ ...form, nature: v })} />
            <Text label="Extent" value={form.extent} onChange={(v) => setForm({ ...form, extent: v })} />
            <Text label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
            <Text label="Likely impact" value={form.likely_impact} onChange={(v) => setForm({ ...form, likely_impact: v })} />
          </div>
          <Area label="Cause" value={form.cause} onChange={(v) => setForm({ ...form, cause: v })} />
          <fieldset className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-200">
            <Check label="Confidentiality" checked={form.confidentiality} onChange={(v) => setForm({ ...form, confidentiality: v })} />
            <Check label="Integrity" checked={form.integrity} onChange={(v) => setForm({ ...form, integrity: v })} />
            <Check label="Availability" checked={form.availability} onChange={(v) => setForm({ ...form, availability: v })} />
            <Check label="Involves children (s. 9)" checked={form.involvesChildren} onChange={(v) => setForm({ ...form, involvesChildren: v })} />
          </fieldset>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <Button type="submit" isLoading={saving} disabled={saving || !form.title || !form.description} className="!w-auto !py-2">
              Open incident
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loading />
        </div>
      ) : incidents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            No incidents recorded
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            If a personal-data breach occurs, open an incident here to start the
            Rule 7 clock.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => {
            const isOpen = openId === inc.incident_id;
            const first =
              isOpen && drafts
                ? hoursLabel(
                    drafts.countdown.first_report_hours_left,
                    drafts.countdown.first_report_overdue
                  )
                : null;
            return (
              <div
                key={inc._id ?? inc.incident_id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <button
                  type="button"
                  onClick={() => void openDrafts(inc.incident_id)}
                  className="flex w-full items-center gap-3 p-5 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {inc.incident_id}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${SEVERITY_STYLE[inc.severity]}`}>
                        {inc.severity}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {inc.status}
                      </span>
                      {inc.involves_children && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                          children
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                      {inc.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                      <ClockIcon className="h-3.5 w-3.5" />
                      First report{" "}
                      {first
                        ? first.text
                        : inc.board_first_reported_at
                          ? `sent ${fmt(inc.board_first_reported_at)}`
                          : `due ${fmt(inc.board_first_report_due_at)}`}
                    </p>
                  </div>
                  <ChevronDownIcon className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200 p-5 dark:border-gray-800">
                    {drafts ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <DraftCard title="Board — first report" body={drafts.board_first_report.body} />
                          <DraftCard title="Board — 72h report" body={drafts.board_detailed_report.body} />
                          <DraftCard title="Data-principal notice" body={drafts.data_principal_notice.body} />
                          <DraftCard
                            title="Status"
                            body={`Status: ${drafts.countdown.status}\nFirst: ${hoursLabel(drafts.countdown.first_report_hours_left, drafts.countdown.first_report_overdue).text}\nDetailed: ${hoursLabel(drafts.countdown.detailed_report_hours_left, drafts.countdown.detailed_report_overdue).text}\nExtension: ${drafts.countdown.extension_granted ? "granted" : "no"}`}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(STAGE_LABELS) as BreachStage[]).map((stage) => (
                            <button
                              key={stage}
                              type="button"
                              onClick={() => void advance(inc.incident_id, stage)}
                              disabled={busyId !== null}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                              {STAGE_LABELS[stage]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center py-6">
                        <Loading />
                      </div>
                    )}
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

function DraftCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <pre className="mt-1.5 whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-gray-700 dark:text-gray-200">
        {body}
      </pre>
    </div>
  );
}

function Text({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-700 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      />
    </label>
  );
}

function Area({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
      {label}
      <textarea
        rows={2}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-700 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      {label}
    </label>
  );
}

export default AdminBreaches;
