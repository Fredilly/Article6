import type { SalesOrganization } from "../lib/sales-store";
import type { SalesWebServiceProfile } from "../lib/sales-web-services";

const fieldClass = "rounded-md border border-gray-300 px-3 py-2 text-sm";

function display(value?: string): string {
  return value?.trim() || "Not recorded";
}

function date(value?: string): string {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

function websiteHref(value?: string): string | undefined {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function serviceLabel(value: string) {
  if (value === "GEO_VISIBILITY") return "GEO Visibility";
  if (value === "WEBSITE_REDESIGN") return "Website Redesign";
  if (value === "BOTH") return "Both";
  return "Unknown";
}

function serviceHypothesis(profile: SalesWebServiceProfile | null) {
  if (!profile?.serviceHypotheses.length) return "Not recorded";
  return profile.serviceHypotheses.map(serviceLabel).join(" + ");
}

function visibility(profile: SalesWebServiceProfile | null) {
  if (!profile || profile.targetAppearing == null) return "Not tested";
  return profile.targetAppearing ? "Yes" : "No";
}

export function WebServicesOrganizationOverview({
  organization,
  profile,
  lastInteractionAt,
}: {
  organization: SalesOrganization;
  profile: SalesWebServiceProfile | null;
  lastInteractionAt?: string;
}) {
  const website = profile?.websiteUrl || organization.domain;
  const websiteLink = websiteHref(website);
  return <>
    <section className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-gray-900">Web Services account overview</h2><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Web Services</span></div></div>
      <div className="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Company</div><div className="mt-1 text-base font-semibold text-gray-900">{organization.name}</div></div>
        <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Website</div><div className="mt-1 text-sm font-semibold">{websiteLink ? <a href={websiteLink} target="_blank" rel="noreferrer" className="text-forest-700 hover:underline">{website}</a> : <span className="text-gray-500">Not recorded</span>}</div></div>
        <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Country</div><div className="mt-1 text-base font-semibold text-gray-900">{display(organization.country)}</div></div>
        <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Service hypothesis</div><div className="mt-1 text-sm font-semibold text-gray-900">{serviceHypothesis(profile)}</div></div>
        <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</div><div className="mt-1 text-base font-semibold text-gray-900">{organization.status}</div></div>
        <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Last interaction</div><div className="mt-1 text-sm font-semibold text-gray-900">{date(lastInteractionAt)}</div></div>
      </div>
    </section>

    <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Website opportunity</h2><p className="mt-1 text-xs text-gray-500">Current website and AI visibility observations.</p></div><div className="text-xs text-gray-500">Last checked: {date(profile?.lastVerifiedAt)}</div></div>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Website</dt><dd className="mt-1 font-medium text-gray-900">{display(profile?.websiteUrl)}</dd></div>
        <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Potential services</dt><dd className="mt-1 font-medium text-gray-900">{serviceHypothesis(profile)}</dd></div>
        <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">AI query tested</dt><dd className="mt-1 font-medium text-gray-900">{display(profile?.aiQueryTested)}</dd></div>
        <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Target appearing in AI results</dt><dd className="mt-1 font-medium text-gray-900">{visibility(profile)}</dd></div>
        <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Competitors appearing</dt><dd className="mt-1 font-medium text-gray-900">{profile?.competitorsAppearing.length ? profile.competitorsAppearing.join(", ") : "Not recorded"}</dd></div>
        <div className="sm:col-span-2 lg:col-span-1"><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Website observation</dt><dd className="mt-1 whitespace-pre-wrap text-gray-700">{display(profile?.websiteObservation)}</dd></div>
      </dl>
      <details className="mt-5 border-t border-gray-100 pt-4"><summary className="cursor-pointer list-none text-sm font-medium text-forest-700">Edit website opportunity</summary>
        <form method="post" action="/api/internal/web-services" className="mt-3 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="update_profile" /><input type="hidden" name="organizationId" value={organization.id} />
          <input name="websiteUrl" defaultValue={profile?.websiteUrl} placeholder="Website URL" className={fieldClass} />
          <select name="targetAppearing" defaultValue={profile?.targetAppearing == null ? "NOT_TESTED" : profile.targetAppearing ? "YES" : "NO"} className={fieldClass}><option value="NOT_TESTED">AI visibility: Not tested</option><option value="YES">AI visibility: Yes</option><option value="NO">AI visibility: No</option></select>
          <fieldset className="rounded-md border border-gray-200 p-3 text-sm md:col-span-2"><legend className="px-1 text-xs font-medium uppercase tracking-wide text-gray-500">Potential services</legend><div className="flex flex-wrap gap-4"><label className="flex items-center gap-2"><input type="checkbox" name="serviceHypotheses" value="GEO_VISIBILITY" defaultChecked={profile?.serviceHypotheses.includes("GEO_VISIBILITY")} /> GEO Visibility</label><label className="flex items-center gap-2"><input type="checkbox" name="serviceHypotheses" value="WEBSITE_REDESIGN" defaultChecked={profile?.serviceHypotheses.includes("WEBSITE_REDESIGN")} /> Website Redesign</label></div></fieldset>
          <input name="aiQueryTested" defaultValue={profile?.aiQueryTested} placeholder="AI query tested" className={`${fieldClass} md:col-span-2`} />
          <input name="competitorsAppearing" defaultValue={profile?.competitorsAppearing.join(", ")} placeholder="Competitors appearing, comma separated" className={`${fieldClass} md:col-span-2`} />
          <textarea name="websiteObservation" defaultValue={profile?.websiteObservation} placeholder="Website observation" className={`${fieldClass} md:col-span-2`} />
          <input name="lastVerifiedAt" type="datetime-local" defaultValue={profile?.lastVerifiedAt ? new Date(profile.lastVerifiedAt).toISOString().slice(0, 16) : ""} className={fieldClass} />
          <button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white">Save website opportunity</button>
        </form>
      </details>
    </section>
  </>;
}

export function WebServicesSalesOpportunity({ organizationId, profile }: { organizationId: string; profile: SalesWebServiceProfile | null }) {
  const money = profile?.commercialValue == null ? "Not recorded" : profile.commercialValue.toLocaleString(undefined, { style: "currency", currency: "EUR" });
  return <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <h2 className="font-semibold">Sales opportunity</h2>
    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Primary service</dt><dd className="mt-1 font-medium text-gray-900">{serviceLabel(profile?.primaryService || "UNKNOWN")}</dd></div>
      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Commercial value</dt><dd className="mt-1 font-medium text-gray-900">{money}</dd></div>
      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Problem confirmed</dt><dd className="mt-1 font-medium text-gray-900">{profile?.problemConfirmed === "YES" ? "Yes" : profile?.problemConfirmed === "NO" ? "No" : "Unknown"}</dd></div>
      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Price discussed</dt><dd className="mt-1 font-medium text-gray-900">{profile?.priceDiscussed ? "Yes" : "No"}</dd></div>
      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Case study sent</dt><dd className="mt-1 font-medium text-gray-900">{profile?.caseStudySent ? "Yes" : "No"}</dd></div>
      <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Next action</dt><dd className="mt-1 font-medium text-gray-900">{display(profile?.nextAction)}</dd></div>
      <div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Next action date</dt><dd className="mt-1 font-medium text-gray-900">{date(profile?.nextActionDate)}</dd></div>
    </dl>
    <details className="mt-4 border-t border-gray-100 pt-4"><summary className="cursor-pointer list-none text-sm font-medium text-forest-700">Edit sales opportunity</summary>
      <form method="post" action="/api/internal/web-services" className="mt-3 grid gap-3 md:grid-cols-2">
        <input type="hidden" name="action" value="update_profile" /><input type="hidden" name="organizationId" value={organizationId} />
        <select name="primaryService" defaultValue={profile?.primaryService || "UNKNOWN"} className={fieldClass}><option value="GEO_VISIBILITY">GEO Visibility</option><option value="WEBSITE_REDESIGN">Website Redesign</option><option value="BOTH">Both</option><option value="UNKNOWN">Unknown</option></select>
        <input name="commercialValue" type="number" min="0" step="0.01" defaultValue={profile?.commercialValue} placeholder="Commercial value" className={fieldClass} />
        <select name="problemConfirmed" defaultValue={profile?.problemConfirmed || "UNKNOWN"} className={fieldClass}><option value="UNKNOWN">Problem confirmed: Unknown</option><option value="YES">Problem confirmed: Yes</option><option value="NO">Problem confirmed: No</option></select>
        <select name="priceDiscussed" defaultValue={profile?.priceDiscussed ? "YES" : "NO"} className={fieldClass}><option value="NO">Price discussed: No</option><option value="YES">Price discussed: Yes</option></select>
        <select name="caseStudySent" defaultValue={profile?.caseStudySent ? "YES" : "NO"} className={fieldClass}><option value="NO">Case study sent: No</option><option value="YES">Case study sent: Yes</option></select>
        <input name="nextAction" defaultValue={profile?.nextAction} placeholder="Next action" className={fieldClass} />
        <input name="nextActionDate" type="datetime-local" defaultValue={profile?.nextActionDate ? new Date(profile.nextActionDate).toISOString().slice(0, 16) : ""} className={fieldClass} />
        <button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white">Save sales opportunity</button>
      </form>
    </details>
  </section>;
}
