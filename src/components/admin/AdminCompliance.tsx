import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  GlobeAltIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlayIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import adminPrivacyService from "../../services/adminPrivacyService";
import type {
  TransferEntry,
  DpiaEntry,
  AuditEntry,
  AuditIntegrityResult,
  RetentionSummary,
} from "../../services/adminPrivacyService";
import { getErrorMessage } from "../../util/errors";
import { Button, Loading } from "../";

type Tab = "transfers" | "dpia" | "audit" | "retention";

const TABS: { id: Tab; label: string; icon: typeof GlobeAltIcon }[] = [
  { id: "transfers", label: "Transfers", icon: GlobeAltIcon },
  { id: "dpia", label: "DPIA / SDF", icon: DocumentMagnifyingGlassIcon },
  { id: "audit", label: "Audit trail", icon: ShieldCheckIcon },
  { id: "retention", label: "Retention", icon: ArrowPathIcon },
];

function fmt(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function AdminCompliance() {
  const [tab, setTab] = useState<Tab>("transfers");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Compliance registers
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Cross-border transfers (s. 16), DPIA/SDF register (s. 10), the
          tamper-evident audit trail (Rule 6(c)) and the retention/erasure pass
          (Rule 8).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              tab === t.id
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "transfers" && <TransfersPanel />}
      {tab === "dpia" && <DpiaPanel />}
      {tab === "audit" && <AuditPanel />}
      {tab === "retention" && <RetentionPanel />}
    </div>
  );
}

function TransfersPanel() {
  const [rows, setRows] = useState<TransferEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    country: "",
    recipient: "",
    purpose_id: "",
    lawful_basis: "consent",
    mechanism: "contractual",
    recipient_type: "processor",
    is_foreign_state_entity: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminPrivacyService.listTransfers();
      setRows(res.data.transfers ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load transfers"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await adminPrivacyService.listTransfers();
        if (active) setRows(res.data.transfers ?? []);
      } catch (err) {
        if (active) toast.error(getErrorMessage(err, "Failed to load transfers"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminPrivacyService.upsertTransfer({ ...form });
      toast.success("Transfer registered");
      setShowForm(false);
      setForm({ ...form, country: "", recipient: "", purpose_id: "" });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save transfer"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm((v) => !v)} className="!w-auto !py-1.5 !text-xs">
          <span className="inline-flex items-center gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Register transfer
          </span>
        </Button>
      </div>

      {showForm && (
        <form onSubmit={save} className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 dark:border-gray-800 dark:bg-gray-900">
          <Input label="Country (ISO-2)" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
          <Input label="Recipient" value={form.recipient} onChange={(v) => setForm({ ...form, recipient: v })} required />
          <Input label="Purpose id" value={form.purpose_id} onChange={(v) => setForm({ ...form, purpose_id: v })} required />
          <Input label="Lawful basis" value={form.lawful_basis} onChange={(v) => setForm({ ...form, lawful_basis: v })} required />
          <Input label="Mechanism" value={form.mechanism} onChange={(v) => setForm({ ...form, mechanism: v })} />
          <label className="flex items-center gap-2 self-end text-sm text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={form.is_foreign_state_entity} onChange={(e) => setForm({ ...form, is_foreign_state_entity: e.target.checked })} className="h-4 w-4" />
            Foreign-state entity (Rule 15)
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="submit" isLoading={saving} disabled={saving} className="!w-auto !py-2">Save</Button>
          </div>
        </form>
      )}

      {loading ? (
        <Center><Loading /></Center>
      ) : rows.length === 0 ? (
        <Empty icon={GlobeAltIcon} text="No transfers registered" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5">Country</th>
                <th className="px-4 py-2.5">Recipient</th>
                <th className="px-4 py-2.5">Purpose</th>
                <th className="px-4 py-2.5">Basis</th>
                <th className="px-4 py-2.5">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.country}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{r.recipient}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.purpose_id}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.lawful_basis}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.restricted && <Tag tone="red">restricted</Tag>}
                      {r.is_foreign_state_entity && <Tag tone="amber">state entity</Tag>}
                      {r.active ? <Tag tone="green">active</Tag> : <Tag tone="gray">inactive</Tag>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DpiaPanel() {
  const [rows, setRows] = useState<DpiaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    activity_name: "",
    lawful_basis: "",
    data_categories: "",
    necessity_notes: "",
    is_sdf: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminPrivacyService.listDpias();
      setRows(res.data.dpias ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load DPIAs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await adminPrivacyService.listDpias();
        if (active) setRows(res.data.dpias ?? []);
      } catch (err) {
        if (active) toast.error(getErrorMessage(err, "Failed to load DPIAs"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminPrivacyService.upsertDpia({
        activity_name: form.activity_name,
        lawful_basis: form.lawful_basis || undefined,
        data_categories: form.data_categories
          ? form.data_categories.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        necessity_notes: form.necessity_notes || undefined,
        is_sdf: form.is_sdf,
      });
      toast.success("DPIA recorded");
      setShowForm(false);
      setForm({ activity_name: "", lawful_basis: "", data_categories: "", necessity_notes: "", is_sdf: false });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save DPIA"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm((v) => !v)} className="!w-auto !py-1.5 !text-xs">
          <span className="inline-flex items-center gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New DPIA
          </span>
        </Button>
      </div>

      {showForm && (
        <form onSubmit={save} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Input label="Activity name" value={form.activity_name} onChange={(v) => setForm({ ...form, activity_name: v })} required />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Lawful basis" value={form.lawful_basis} onChange={(v) => setForm({ ...form, lawful_basis: v })} />
            <Input label="Data categories (comma-separated)" value={form.data_categories} onChange={(v) => setForm({ ...form, data_categories: v })} />
          </div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            Necessity notes
            <textarea rows={2} value={form.necessity_notes} onChange={(e) => setForm({ ...form, necessity_notes: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-700 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={form.is_sdf} onChange={(e) => setForm({ ...form, is_sdf: e.target.checked })} className="h-4 w-4" />
            Significant Data Fiduciary (Rule 13)
          </label>
          <div className="flex justify-end gap-2">
            <Button type="submit" isLoading={saving} disabled={saving || !form.activity_name} className="!w-auto !py-2">Save</Button>
          </div>
        </form>
      )}

      {loading ? (
        <Center><Loading /></Center>
      ) : rows.length === 0 ? (
        <Empty icon={DocumentMagnifyingGlassIcon} text="No DPIAs recorded" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((d) => (
            <div key={d._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-900 dark:text-white">{d.activity_name}</p>
                <Tag tone={d.residual_rating === "low" ? "green" : d.residual_rating === "unacceptable" ? "red" : "amber"}>
                  {d.residual_rating}
                </Tag>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Decision: {d.decision.replace(/_/g, " ")} · Reviewed {fmt(d.reviewed_at)}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Next review {fmt(d.next_review_due_at)} {d.is_sdf && "· SDF"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [integrity, setIntegrity] = useState<AuditIntegrityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [log, verify] = await Promise.all([
          adminPrivacyService.listAudit({ limit: 100 }),
          adminPrivacyService.verifyAuditChain(),
        ]);
        if (!active) return;
        setEntries(log.data.entries ?? []);
        setIntegrity(verify.data);
      } catch (err) {
        if (active) toast.error(getErrorMessage(err, "Failed to load audit log"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const recheck = async () => {
    setChecking(true);
    try {
      const res = await adminPrivacyService.verifyAuditChain();
      setIntegrity(res.data);
      toast.success(res.data.valid ? "Audit chain intact" : "Audit chain BROKEN");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to verify"));
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <Center><Loading /></Center>;

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
          integrity?.valid
            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
            : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
        }`}
      >
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className={`h-6 w-6 shrink-0 ${integrity?.valid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
          <div>
            <p className={`text-sm font-semibold ${integrity?.valid ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
              {integrity?.valid ? "Audit chain verified — tamper-evident hash chain intact" : "Audit chain verification failed"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {integrity?.count ?? 0} entries checked
              {integrity?.brokenAt ? ` · broken at ${integrity.brokenAt}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void recheck()}
          disabled={checking}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-white disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowPathIcon className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          Re-verify
        </button>
      </div>

      {entries.length === 0 ? (
        <Empty icon={ShieldCheckIcon} text="No audit entries yet" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {entries.map((e) => (
                <tr key={e._id}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{fmt(e.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-gray-200">{e.action}</td>
                  <td className="px-4 py-3 text-xs capitalize text-gray-600 dark:text-gray-300">{e.category}</td>
                  <td className="px-4 py-3">
                    <Tag tone={e.status === "SUCCESS" ? "green" : "red"}>{e.status}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RetentionPanel() {
  const [summary, setSummary] = useState<RetentionSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [dryRun, setDryRun] = useState(true);

  const run = async () => {
    setRunning(true);
    try {
      const res = await adminPrivacyService.runRetention(dryRun);
      setSummary(res.data);
      toast.success(dryRun ? "Dry-run complete (nothing erased)" : "Retention pass executed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to run retention"));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Run the Rule 8 retention/erasure pass. Dry-run (default) reports what
          would be erased; turning it off performs the erasure across expired
          records.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4" />
          Dry run (recommended — reports only)
        </label>
        <div className="mt-4">
          <Button type="button" onClick={() => void run()} isLoading={running} disabled={running} className="!w-auto">
            <span className="inline-flex items-center gap-1.5">
              <PlayIcon className="h-4 w-4" />
              {dryRun ? "Run dry-run" : "Run erasure pass"}
            </span>
          </Button>
        </div>
      </div>

      {summary && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Pass summary
          </p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs text-gray-700 dark:text-gray-200">
            {JSON.stringify(summary, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-center py-16">{children}</div>;
}

function Empty({ icon: Icon, text }: { icon: typeof GlobeAltIcon; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
      <Icon className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">{text}</p>
    </div>
  );
}

const TONES: Record<string, string> = {
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

function Tag({ tone, children }: { tone: keyof typeof TONES | string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${TONES[tone] ?? TONES.gray}`}>
      {children}
    </span>
  );
}

function Input({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
      {label}
      <input
        type="text"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-700 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      />
    </label>
  );
}

export default AdminCompliance;
