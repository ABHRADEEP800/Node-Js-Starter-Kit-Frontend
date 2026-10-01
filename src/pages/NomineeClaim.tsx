import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import PrivacyService from "../services/privacyService";
import { getErrorMessage } from "../util/errors";
import { Button, Container, Input } from "../components";

/**
 * PUBLIC page (s. 14): a nominated person files a claim on a Data Principal's
 * data after her death or incapacity. The claim is reviewed by our DPO; on
 * approval the nominee may exercise the DP's rights. No login required — the
 * claimant may not have an account.
 */
function NomineeClaim() {
  const [form, setForm] = useState({
    dataPrincipalId: "",
    nomineeIndex: "0",
    claimantName: "",
    claimantContact: "",
    claimantRelationship: "",
    basis: "death" as "death" | "incapacity",
    evidenceReference: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      const res = await PrivacyService.submitNomineeClaim({
        dataPrincipalId: form.dataPrincipalId.trim(),
        nomineeIndex: Number(form.nomineeIndex) || 0,
        claimantName: form.claimantName.trim(),
        claimantContact: form.claimantContact.trim() || undefined,
        claimantRelationship: form.claimantRelationship.trim() || undefined,
        basis: form.basis,
        evidenceReference: form.evidenceReference.trim() || undefined,
        note: form.note.trim() || undefined,
      });
      setDone(res.data.claim_id);
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit the claim"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container>
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheckIcon className="h-7 w-7 text-brand-600 dark:text-brand-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nominee claim
          </h1>
        </div>

        {done ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-950/40">
            <h2 className="text-base font-semibold text-green-900 dark:text-green-200">
              Claim received
            </h2>
            <p className="mt-1 text-sm text-green-800 dark:text-green-300">
              Your reference is <strong>{done}</strong>. Our Data Protection
              Officer will verify your documents and contact you. If approved, you
              may exercise the Data Principal&apos;s rights under s. 14.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block text-sm font-medium text-brand-600 underline dark:text-brand-400"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Use this page if you are a nominated person (s. 14) and the Data
              Principal has died or become incapacitated. We collect only what is
              needed to verify the claim; identity details are encrypted at rest.
            </p>

            <Input
              label="Data Principal ID"
              required
              placeholder="The account/user id of the Data Principal"
              value={form.dataPrincipalId}
              onChange={(e) => setForm({ ...form, dataPrincipalId: e.target.value })}
            />
            <Input
              label="Nominee position (0-based)"
              type="number"
              min={0}
              max={4}
              value={form.nomineeIndex}
              onChange={(e) => setForm({ ...form, nomineeIndex: e.target.value })}
            />
            <Input
              label="Your full name"
              required
              value={form.claimantName}
              onChange={(e) => setForm({ ...form, claimantName: e.target.value })}
            />
            <Input
              label="Your email/phone (optional)"
              value={form.claimantContact}
              onChange={(e) => setForm({ ...form, claimantContact: e.target.value })}
            />
            <Input
              label="Relationship to the Data Principal (optional)"
              value={form.claimantRelationship}
              onChange={(e) =>
                setForm({ ...form, claimantRelationship: e.target.value })
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Basis of claim
              </label>
              <select
                value={form.basis}
                onChange={(e) =>
                  setForm({ ...form, basis: e.target.value as "death" | "incapacity" })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="death">Death of the Data Principal</option>
                <option value="incapacity">Incapacity of the Data Principal</option>
              </select>
            </div>
            <Input
              label="Evidence reference (optional)"
              placeholder="e.g. death certificate number / reference"
              value={form.evidenceReference}
              onChange={(e) =>
                setForm({ ...form, evidenceReference: e.target.value })
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Note (optional)
              </label>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <Button type="submit" isLoading={busy} disabled={busy}>
              Submit claim
            </Button>
          </form>
        )}
      </div>
    </Container>
  );
}

export default NomineeClaim;
