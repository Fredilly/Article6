import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import SalesAutoRefresh from "../../../components/SalesAutoRefresh";
import SalesOrganizationsTable from "../../../components/SalesOrganizationsTable";
import { loadSalesHomepageData } from "../../../lib/sales-homepage-store";
import { buildSalesMemorySearchEntries } from "../../../lib/sales-search";
import type { SalesOrganization, SalesOrganizationDetail, SalesTenderOpportunity } from "../../../lib/sales-store";
import { SALES_EXPERIMENTS } from "../../../lib/sales-memory";

interface Props { details: SalesOrganizationDetail[]; organizations: SalesOrganization[]; tenderOpportunities: SalesTenderOpportunity[]; searchEntries: ReturnType<typeof buildSalesMemorySearchEntries>; initialQuery: string; initialStatus: "ALL" | SalesOrganization["status"]; }

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const { details, tenderOpportunities } = await loadSalesHomepageData();
  const organizations = details.map((detail) => detail.organization);
  const rawStatus = typeof query.status === "string" ? query.status : "ALL";
  const initialStatus = rawStatus === "ALL" || organizations.some((organization) => organization.status === rawStatus) ? rawStatus as Props["initialStatus"] : "ALL";
  return { props: { details, organizations, tenderOpportunities, searchEntries: buildSalesMemorySearchEntries(details), initialQuery: typeof query.q === "string" ? query.q : "", initialStatus } };
};

function experimentLabel(value: string) {
  if (value === "ARTICLE6_CARBON") return "Article6 Carbon";
  if (value === "TENDER_READINESS") return "Tender Readiness";
  if (value === "ECOVADIS_SUPPLIER_COMPLIANCE") return "EcoVadis / Supplier Compliance";
  return "Other";
}

export default function SalesIndexPage({ details, organizations, tenderOpportunities, searchEntries, initialQuery, initialStatus }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <><Head><title>Sales Memory | Article6 Internal</title><meta name="robots" content="noindex,nofollow" /></Head><SalesAutoRefresh />
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-forest-700">Internal experiments & sales</p>
      <div className="mt-2 flex justify-end"><Link href="/internal/sales/import-review" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">Review imports</Link></div>
      <div className="mt-4 flex justify-end"><details><summary className="cursor-pointer list-none text-sm font-medium text-gray-500 hover:text-gray-800">+ Add organization manually</summary><section className="mt-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><form method="post" action="/api/internal/sales" className="grid gap-3 md:grid-cols-5"><input type="hidden" name="action" value="create_organization" /><input required name="name" placeholder="Organization name" className="rounded-md border border-gray-300 px-3 py-2 text-sm" /><input name="domain" placeholder="Domain" className="rounded-md border border-gray-300 px-3 py-2 text-sm" /><input name="country" placeholder="Country" className="rounded-md border border-gray-300 px-3 py-2 text-sm" /><select name="experiment" defaultValue="ARTICLE6_CARBON" className="rounded-md border border-gray-300 px-3 py-2 text-sm">{SALES_EXPERIMENTS.map((value) => <option key={value} value={value}>{experimentLabel(value)}</option>)}</select><button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">Add organization</button></form></section></details></div>
      <SalesOrganizationsTable organizations={organizations} details={details} searchEntries={searchEntries} initialQuery={initialQuery} initialStatus={initialStatus} />
      <section className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><div><h2 className="font-semibold">Tender Readiness</h2><p className="mt-1 text-xs text-gray-500">Tender opportunities are tracked separately from VCS carbon projects.</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{tenderOpportunities.length}</span></div><div className="divide-y divide-gray-100">{tenderOpportunities.length ? tenderOpportunities.map((tender) => <Link key={tender.id} href={`/internal/sales/tenders/${tender.id}`} className="block px-5 py-4 hover:bg-gray-50"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold text-gray-900">{tender.name}</div><div className="mt-1 text-sm text-gray-600">{tender.contactName || "No contact"}</div></div><div className="text-right"><div className="text-sm font-semibold text-amber-700">{tender.status}</div><div className="mt-1 text-xs text-gray-500">Deadline: {tender.submissionDeadline ? new Date(tender.submissionDeadline).toLocaleString() : "Not set"}</div></div></div></Link>) : <p className="px-5 py-5 text-sm text-gray-500">No tender opportunities yet.</p>}</div></section>
    </div></main>
  </>;
}
