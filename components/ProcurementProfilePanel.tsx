import { useEffect, useMemo, useState } from "react";
import {
  AI_USAGE_OPTIONS,
  BID_DECISION_PROCESSES,
  BID_PREPARATION_MODELS,
  DISCOVERY_METHOD_OPTIONS,
  DISCOVERY_PROBLEM_OPTIONS,
  EVIDENCE_LIBRARY_MATURITIES,
  INDEPENDENT_REVIEW_FREQUENCIES,
  PRIMARY_PROCUREMENT_PAINS,
  PROCUREMENT_FREQUENCY_BANDS,
  PROCUREMENT_PROFILE_CONFIDENCES,
  PROCUREMENT_PROFILE_SOURCES,
  PROCUREMENT_WINS_BANDS,
  type SalesProcurementProfile,
} from "../lib/sales-procurement-domain";

type ContactOption = { id: string; name: string; title?: string };
type Payload = { ok: boolean; profile: SalesProcurementProfile | null; contacts: ContactOption[] };

const fieldClass = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm";

function label(value?: string) {
  if (!value || value === "UNKNOWN") return "Unknown";
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function display(value?: string) {
  const unknown = !value || value === "UNKNOWN";
  return <span className={unknown ? "text-gray-400" : "text-gray-900"}>{label(value)}</span>;
}

function ListDisplay({ values }: { values?: string[] }) {
  if (!values?.length) return <span className="text-gray-400">Unknown</span>;
  return <span className="text-gray-900">{values.join(" · ")}</span>;
}

function optionsWithCurrent(base: readonly string[], current?: string[]) {
  return Array.from(new Set([...base, ...(current || [])]));
}

export default function ProcurementProfilePanel({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/internal/procurement-profile?organizationId=${encodeURIComponent(organizationId)}`, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load procurement profile");
        return response.json() as Promise<Payload>;
      })
      .then((payload) => { if (active) setData(payload); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [organizationId]);

  const profile = data?.profile || null;
  const discoveryMethodOptions = useMemo(() => optionsWithCurrent(DISCOVERY_METHOD_OPTIONS, profile?.discoveryMethods), [profile?.discoveryMethods]);
  const discoveryProblemOptions = useMemo(() => optionsWithCurrent(DISCOVERY_PROBLEM_OPTIONS, profile?.discoveryProblems), [profile?.discoveryProblems]);
  const aiOptions = useMemo(() => optionsWithCurrent(AI_USAGE_OPTIONS, profile?.aiUsage), [profile?.aiUsage]);

  return <section className="mt-4 rounded-lg border border-gray-200 bg-white shadow-sm">
    <details>
      <summary className="cursor-pointer list-none px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Procurement profile</h2>
            <p className="mt-0.5 text-xs text-gray-500">Structured bidder behavior and procurement context.</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${profile?.bidderSegment && profile.bidderSegment !== "UNKNOWN" ? "bg-gray-100 text-gray-700" : "bg-gray-50 text-gray-400"}`}>{label(profile?.bidderSegment)}</span>
        </div>
      </summary>

      <div className="border-t border-gray-100 px-5 py-4">
        {failed ? <p className="text-sm text-red-700">Procurement profile could not be loaded.</p> : !data ? <p className="text-sm text-gray-400">Loading procurement profile…</p> : <>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs uppercase tracking-wide text-gray-400">Bidder segment</dt><dd className="mt-1 font-medium">{display(profile?.bidderSegment)}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-400">Bids submitted / year</dt><dd className="mt-1 font-medium">{display(profile?.bidsSubmittedBand)}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-400">Bid decision</dt><dd className="mt-1 font-medium">{display(profile?.bidDecisionProcess)}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-400">Primary pain</dt><dd className="mt-1 font-medium">{display(profile?.primaryProcurementPain)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-gray-400">Discovery problems</dt><dd className="mt-1"><ListDisplay values={profile?.discoveryProblems} /></dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-400">Independent review</dt><dd className="mt-1 font-medium">{display(profile?.independentReviewFrequency)}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-400">Evidence library</dt><dd className="mt-1 font-medium">{display(profile?.evidenceLibraryMaturity)}</dd></div>
          </dl>

          <details className="mt-4 border-t border-gray-100 pt-3">
            <summary className="cursor-pointer list-none text-xs font-medium text-forest-700 hover:underline">Edit</summary>
            <form method="post" action="/api/internal/procurement-profile" className="mt-3 grid gap-4">
              <input type="hidden" name="organizationId" value={organizationId} />
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs text-gray-600">Opportunities considered / year<select name="opportunitiesConsideredBand" defaultValue={profile?.opportunitiesConsideredBand || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{PROCUREMENT_FREQUENCY_BANDS.filter((v) => v !== "UNKNOWN").map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
                <label className="text-xs text-gray-600">Bids submitted / year<select name="bidsSubmittedBand" defaultValue={profile?.bidsSubmittedBand || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{PROCUREMENT_FREQUENCY_BANDS.filter((v) => v !== "UNKNOWN").map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
                <label className="text-xs text-gray-600">Wins / year<select name="winsBand" defaultValue={profile?.winsBand || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{PROCUREMENT_WINS_BANDS.filter((v) => v !== "UNKNOWN").map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
                <label className="text-xs text-gray-600">Bid decision process<select name="bidDecisionProcess" defaultValue={profile?.bidDecisionProcess || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{BID_DECISION_PROCESSES.filter((v) => v !== "UNKNOWN").map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
                <label className="text-xs text-gray-600">Bid decision owner<select name="bidDecisionOwnerContactId" defaultValue={profile?.bidDecisionOwnerContactId || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{data.contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}{contact.title ? ` · ${contact.title}` : ""}</option>)}</select></label>
                <label className="text-xs text-gray-600">Bid preparation model<select name="bidPreparationModel" defaultValue={profile?.bidPreparationModel || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{BID_PREPARATION_MODELS.filter((v) => v !== "UNKNOWN").map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
                <label className="text-xs text-gray-600">Independent review frequency<select name="independentReviewFrequency" defaultValue={profile?.independentReviewFrequency || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{INDEPENDENT_REVIEW_FREQUENCIES.filter((v) => v !== "UNKNOWN").map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
                <label className="text-xs text-gray-600">Evidence library maturity<select name="evidenceLibraryMaturity" defaultValue={profile?.evidenceLibraryMaturity || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{EVIDENCE_LIBRARY_MATURITIES.filter((v) => v !== "UNKNOWN").map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
                <label className="text-xs text-gray-600">Primary procurement pain<select name="primaryProcurementPain" defaultValue={profile?.primaryProcurementPain || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{PRIMARY_PROCUREMENT_PAINS.filter((v) => v !== "UNKNOWN").map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs text-gray-600">Discovery methods<input type="hidden" name="discoveryMethods" value="" /><select multiple name="discoveryMethods" defaultValue={profile?.discoveryMethods || []} className={`mt-1 min-h-32 ${fieldClass}`}>{discoveryMethodOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
                <label className="text-xs text-gray-600">Discovery problems<input type="hidden" name="discoveryProblems" value="" /><select multiple name="discoveryProblems" defaultValue={profile?.discoveryProblems || []} className={`mt-1 min-h-32 ${fieldClass}`}>{discoveryProblemOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
                <label className="text-xs text-gray-600">AI usage<input type="hidden" name="aiUsage" value="" /><select multiple name="aiUsage" defaultValue={profile?.aiUsage || []} className={`mt-1 min-h-32 ${fieldClass}`}>{aiOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-gray-600">Profile source<select name="profileSource" defaultValue={profile?.profileSource || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{PROCUREMENT_PROFILE_SOURCES.filter((v) => v !== "UNKNOWN").map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
                <label className="text-xs text-gray-600">Confidence<select name="profileConfidence" defaultValue={profile?.profileConfidence || ""} className={`mt-1 ${fieldClass}`}><option value="">Unknown / not recorded</option>{PROCUREMENT_PROFILE_CONFIDENCES.filter((v) => v !== "UNKNOWN").map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
              </div>

              <label className="text-xs text-gray-600">Notes<textarea name="notes" defaultValue={profile?.notes || ""} rows={3} className={`mt-1 ${fieldClass}`} /></label>
              <label className="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" name="verified" />Mark the information in this save as explicitly verified now</label>
              <div className="flex items-center justify-between gap-3"><span className="text-xs text-gray-400">Last verified: {profile?.lastVerifiedAt ? new Date(profile.lastVerifiedAt).toLocaleString() : "Unknown"}</span><button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white">Save profile</button></div>
            </form>
          </details>
        </>}
      </div>
    </details>
  </section>;
}
