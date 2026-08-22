import Link from "next/link";
import type { SalesOrganization, SalesProject, SalesTenderOpportunity } from "../lib/sales-store";

interface Props {
  organization: SalesOrganization;
  projects: SalesProject[];
  tenderOpportunities: SalesTenderOpportunity[];
  interactionCount: number;
}

function websiteHref(domain?: string): string | undefined {
  if (!domain) return undefined;
  return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
}

function value(value?: string | number): string {
  return value == null || value === "" ? "Not recorded" : String(value);
}

function money(valueToFormat?: number): string {
  return valueToFormat == null
    ? "Not recorded"
    : valueToFormat.toLocaleString(undefined, { style: "currency", currency: "EUR" });
}

function date(valueToFormat?: string): string {
  return valueToFormat ? new Date(valueToFormat).toLocaleString() : "Not set";
}

function Website({ domain }: { domain?: string }) {
  const href = websiteHref(domain);
  return href ? <a href={href} target="_blank" rel="noreferrer" className="text-base font-semibold text-forest-700 hover:underline">{domain}</a> : <span className="text-base font-semibold text-gray-500">Not recorded</span>;
}

export function CarbonOrganizationOverview({ organization, projects, interactionCount }: Omit<Props, "tenderOpportunities"> & { tenderOpportunities?: never }) {
  return <section className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-5 py-3"><h2 className="text-sm font-semibold text-gray-900">Account overview</h2></div>
    <div className="grid gap-px bg-gray-100 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Company</div><div className="mt-1 text-base font-semibold text-gray-900">{organization.name}</div></div>
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Website</div><div className="mt-1"><Website domain={organization.domain} /></div></div>
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Projects</div><div className="mt-1 text-base font-semibold text-gray-900">{projects.length}</div></div>
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Interactions</div><div className="mt-1 text-base font-semibold text-gray-900">{interactionCount}</div></div>
    </div>
    <div className="border-t border-gray-100">
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-4 bg-gray-50 px-5 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid"><div>Project</div><div>Project ID</div><div>Methodology</div><div>Version</div></div>
      {projects.length ? projects.map((project) => <div key={project.id} className="grid gap-3 border-t border-gray-100 px-5 py-4 first:border-t-0 md:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)] md:items-center md:gap-4">
        <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Project</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.name}</div><div className={`mt-1 text-xs font-medium ${project.blocked ? "text-red-700" : "text-gray-500"}`}>Overall: {project.rolledUpStatus || "NEW"}{project.stakeholderCount && project.stakeholderCount > 1 ? ` · ${project.stakeholderCount} stakeholders` : ""}{project.blocked ? " · OUTREACH BLOCKED" : ""}</div></div>
        <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Project ID</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.vcsId ? `VCS ${project.vcsId}` : "Not recorded"}</div></div>
        <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Methodology</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.methodology || "Not recorded"}</div></div>
        <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Version</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.methodologyVersion || "Not recorded"}</div></div>
      </div>) : <div className="px-5 py-4 text-sm text-gray-500">No projects recorded.</div>}
    </div>
  </section>;
}

export function TenderOrganizationOverview({ organization, tenderOpportunities, interactionCount }: Omit<Props, "projects"> & { projects?: never }) {
  const activeTenderCount = tenderOpportunities.filter((tender) => tender.status !== "AWARDED" && tender.status !== "NOT_AWARDED").length;
  return <section className="mt-6 overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm">
    <div className="border-b border-amber-100 bg-amber-50/60 px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-gray-900">Tender Readiness account overview</h2><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Tender Readiness</span></div></div>
    <div className="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Organization</div><div className="mt-1 text-base font-semibold text-gray-900">{organization.name}</div></div>
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Website</div><div className="mt-1"><Website domain={organization.domain} /></div></div>
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Country</div><div className="mt-1 text-base font-semibold text-gray-900">{value(organization.country)}</div></div>
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Sales status</div><div className="mt-1 text-base font-semibold text-gray-900">{organization.status}</div></div>
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Next action</div><div className="mt-1 text-sm font-semibold text-gray-900">{value(organization.nextAction)}</div></div>
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Assigned owner</div><div className="mt-1 text-sm font-semibold text-gray-900">{value(organization.assignedOwner)}</div></div>
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Active tender opportunities</div><div className="mt-1 text-base font-semibold text-gray-900">{activeTenderCount}</div></div>
      <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Interactions</div><div className="mt-1 text-base font-semibold text-gray-900">{interactionCount}</div></div>
    </div>
    <div className="border-t border-amber-100"><div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.1fr)] gap-4 bg-amber-50/50 px-5 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid"><div>Tender name</div><div>Buyer</div><div>Submission deadline</div><div>Status</div><div>Contract value</div></div>{tenderOpportunities.length ? tenderOpportunities.map((tender) => <Link key={tender.id} href={`/internal/sales/tenders/${tender.id}`} className="grid gap-2 border-t border-amber-100 px-5 py-4 hover:bg-amber-50/40 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.1fr)] md:items-center md:gap-4"><div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Tender name</div><div className="text-sm font-semibold text-gray-900">{tender.name}</div></div><div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Buyer</div><div className="text-sm text-gray-700">{value(tender.buyer)}</div></div><div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Submission deadline</div><div className="text-sm text-gray-700">{date(tender.submissionDeadline)}</div></div><div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Status</div><div className="text-sm font-semibold text-amber-700">{tender.status}</div></div><div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Contract value</div><div className="text-sm text-gray-700">{money(tender.contractValue)}</div></div></Link>) : <div className="px-5 py-4 text-sm text-gray-500">No tender opportunities recorded.</div>}</div>
  </section>;
}
