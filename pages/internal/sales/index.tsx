import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import SalesOrganizationsTable from "../../../components/SalesOrganizationsTable";
import { buildSalesMemorySearchEntries } from "../../../lib/sales-search";
import { getSalesOrganizationDetail, listSalesOrganizations, type SalesOrganization } from "../../../lib/sales-store";
import { SALES_EXPERIMENTS } from "../../../lib/sales-memory";

interface Props { organizations: SalesOrganization[]; searchEntries: ReturnType<typeof buildSalesMemorySearchEntries>; initialQuery: string; initialStatus: "ALL" | SalesOrganization["status"]; }

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const organizations = await listSalesOrganizations("");
  const details = (await Promise.all(organizations.map((organization) => getSalesOrganizationDetail(organization.id)))).filter((detail): detail is NonNullable<typeof detail> => Boolean(detail));
  const rawStatus = typeof query.status === "string" ? query.status : "ALL";
  const initialStatus = rawStatus === "ALL" || organizations.some((organization) => organization.status === rawStatus) ? rawStatus as Props["initialStatus"] : "ALL";
  return { props: { organizations, searchEntries: buildSalesMemorySearchEntries(details), initialQuery: typeof query.q === "string" ? query.q : "", initialStatus } };
};

function experimentLabel(value: string) {
  if (value === "ARTICLE6_CARBON") return "Article6 Carbon";
  if (value === "TENDER_READINESS") return "Tender Readiness";
  if (value === "ECOVADIS_SUPPLIER_COMPLIANCE") return "EcoVadis / Supplier Compliance";
  return "Other";
}

export default function SalesIndexPage({ organizations, searchEntries, initialQuery, initialStatus }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <><Head><title>Sales Memory | Article6 Internal</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-forest-700">Internal experiments & sales</p>
      <div className="mt-2 flex justify-end"><Link href="/internal/sales/import-review" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">Review imports</Link></div>
      <div className="mt-4 flex justify-end"><details><summary className="cursor-pointer list-none text-sm font-medium text-gray-500 hover:text-gray-800">+ Add organization manually</summary><section className="mt-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><form method="post" action="/api/internal/sales" className="grid gap-3 md:grid-cols-5"><input type="hidden" name="action" value="create_organization" /><input required name="name" placeholder="Organization name" className="rounded-md border border-gray-300 px-3 py-2 text-sm" /><input name="domain" placeholder="Domain" className="rounded-md border border-gray-300 px-3 py-2 text-sm" /><input name="country" placeholder="Country" className="rounded-md border border-gray-300 px-3 py-2 text-sm" /><select name="experiment" defaultValue="ARTICLE6_CARBON" className="rounded-md border border-gray-300 px-3 py-2 text-sm">{SALES_EXPERIMENTS.map((value) => <option key={value} value={value}>{experimentLabel(value)}</option>)}</select><button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">Add organization</button></form></section></details></div>
      <SalesOrganizationsTable organizations={organizations} searchEntries={searchEntries} initialQuery={initialQuery} initialStatus={initialStatus} />
    </div></main>
  </>;
}
