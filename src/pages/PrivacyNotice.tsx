import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import PrivacyService from "../services/privacyService";
import type { NoticeResponse } from "../types/dpdp";
import { getErrorMessage } from "../util/errors";
import { Loading } from "../components";

// Interpolate {tokens} in a localised string.
const fill = (template: string | undefined, vars: Record<string, string | number> = {}) =>
  String(template ?? "").replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] === undefined ? `{${k}}` : String(vars[k])
  );

function PrivacyNotice() {
  const [language, setLanguage] = useState("en");
  const [notice, setNotice] = useState<NoticeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await PrivacyService.getNotice(language);
        if (active) {
          setNotice(res.data);
          setError(null);
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load the notice"));
      }
    })();
    return () => {
      active = false;
    };
  }, [language]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }
  if (!notice) return <Loading />;

  const dpo = notice.data_fiduciary.dpo;
  const t = notice.strings;
  const languages = notice.available_languages ?? [];
  const isTranslated = notice.translation_status === "translated" || notice.translation_status === "authored";

  return (
    <div className="bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-7 w-7 text-brand-600 dark:text-brand-400" />
            {/* Localised heading does not have a lang on <html>, so mark it. */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {notice.heading}
            </h1>
          </div>
          <label className="text-sm text-gray-600 dark:text-gray-300">
            {t.languageLabel}:{" "}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={t.languageLabel}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              {(languages.length
                ? languages
                : [{ code: "en", label: "English" }]
              ).map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.noticeVersionLabel} <strong>{notice.notice_version}</strong> ·{" "}
          {notice.legal_version}
        </p>

        {!isTranslated && (
          <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            {t.fallbackNotice}
          </p>
        )}

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.whoWeAreTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {fill(t.dataFiduciaryText, { name: notice.data_fiduciary.name })}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <strong>{t.dpoLabel}:</strong> {dpo.name}
            {dpo.email && <> · {dpo.email}</>}
            {dpo.phone && <> · {dpo.phone}</>}
            {dpo.address && <> · {dpo.address}</>}
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.collectTitle}
          </h2>
          <div className="mt-3 space-y-3">
            {notice.items.map((item) => (
              <div
                key={item.purpose_id}
                className="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.purpose}{" "}
                  <span className="ml-1 text-xs font-normal text-gray-500">
                    ({item.required ? t.requiredLabel : t.optionalLabel})
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {item.purpose_description}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t.dataLabel}: {item.personal_data.join(", ")} ·{" "}
                  {t.lawfulBasisLabel}: {item.lawful_basis} ·{" "}
                  {item.retention_days
                    ? fill(t.retentionDaysLabel, { days: item.retention_days })
                    : t.retentionActiveLabel}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.notCollectTitle}
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
            {notice.not_collected_without_consent.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>

        {notice.cookie_categories && notice.cookie_categories.length > 0 && (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.cookiesTitle}
            </h2>
            <div className="mt-3 space-y-2">
              {notice.cookie_categories.map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {c.label}{" "}
                    <span className="ml-1 text-xs font-normal text-gray-500">
                      ({c.consent_required
                        ? t.consentRequiredLabel
                        : fill(t.alwaysOnLabel, { basis: c.lawful_basis })})
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{c.description}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {t.examplesLabel}: {c.examples.join(", ")}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {t.cookieSettingsNote}{" "}
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("dpdp:open-cookie-settings"))
                }
                className="font-medium text-brand-600 underline dark:text-brand-400"
              >
                {t.cookieSettingsButton}
              </button>
            </p>
          </section>
        )}

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.rightsTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t.manageInPrivacyCenter}{" "}
            <Link to="/privacy" className="font-medium text-brand-600 underline dark:text-brand-400">
              {t.privacyCenterLink}
            </Link>
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
            {Object.entries(notice.rights).map(([key, endpoint]) => (
              <li key={key}>
                <span className="capitalize">{key}</span>:{" "}
                {notice.rights_descriptions?.[key] ?? endpoint}{" "}
                <span className="text-xs text-gray-400">({endpoint})</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            {fill(t.boardComplaintText, {
              board: notice.board_complaint.name,
              note: notice.board_complaint.note,
            })}{" "}
            <a
              href={notice.board_complaint.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-600 underline dark:text-brand-400"
            >
              {notice.board_complaint.name}
            </a>
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.dutiesTitle}
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
            {notice.data_principal_duties.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.consentTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {notice.consent_statement}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {notice.withdrawal_consequences}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {notice.severability_statement}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {notice.accountability_statement}
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyNotice;
