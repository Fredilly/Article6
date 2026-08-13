import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import SalesMemorySearch, { type SalesMemorySearchEntry } from "../../../components/SalesMemorySearch";
import { getSalesOrganizationDetail, listSalesOrganizations, type SalesOrganization } from "../../../lib/sales-store";

interface Props { organizations: SalesOrganization[]; searchEntries: SalesMemorySearchEntry[]; }

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const organizations = await listSalesOrganizations("");
  const details = await Promise.all(organizations.map((organization) => getSalesOrganizationDetail(organization.id)));
  const projectEntries: SalesMemorySearchEntry[] = [];
  const organizationEntries: SalesMemorySearchEntry[] = [];
  const contactEntries: SalesMemorySearchEntry[] = [];

  for (const detail of details) {
    if (!detail) continue;
    const { organization, projects, contacts } = detail;
    organizationEntries.push({
      key: `organization-${organization.id}`,
      kind: "organization",
      organizationId: organization.id,
      title: organization.name,
      subtitle: organization.domain || "No domain",
      searchText: [organization.name, organization.domain].filter(Boolean).join(" ").toLowerCase(),
      status: organization.status,
      doNotContact: organization.doNotContact,
    });

    for (const project of projects) {
      projectEntries.push({
        key: `project-${organization.id}-${project.id}`,
        kind: "project",
        organizationId: organization.id,
        title: project.vcsId ? `VCS ${project.vcsId} · ${project.name}` : project.name,
        subtitle: [organization.name, project.methodology && `${project.methodology}${project.methodologyVersion ? ` ${project.methodologyVersion}` : ""}`].filter(Boolean).join(" · "),
        searchText: [project.vcsId, project.name, project.methodology, project.methodologyVersion, organization.name].filter(Boolean).join(" ").toLowerCase(),
        status: organization.status,
        doNotContact: organization.doNotContact,
      });
    }

    for (const contact of contacts) {
      contactEntries.push({
        key: `contact-${organization.id}-${contact.id}`,
        kind: "contact",
        organizationId: organization.id,
        title: contact.name,
        subtitle: [organization.name, contact.email].filter(Boolean).join(" · "),
        searchText: [contact.name, contact.email, organization.name].filter(Boolean).join(" ").toLowerCase(),
        status: organization.status,
        doNotContact: organization.doNotContact,
      });
    }
  }

  return { props: { organizations, searchEntries: [...projectEntries, ...organizationEntries, ...contactEntries] } };
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "Never";
}

function statusClass(status: string) {
  if (status === "DO_NOT_CONTACT" || status === "CLOSED_NO") return "bg-red-50 text-red-700";
  if (status === "OPPORTUNITY" || status === "CLOSED_WON") return "bg-green-50 text-green-700";
  if (status === "NURTURE") return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-700";
}

export default function SalesIndexPage({ organizations, searchEntries }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <>
    <Head><title>Sales Memory | Article6 Internal</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-forest-700">Article6 internal tool</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Sales memory</h1><p className="mt-2 text-sm text-gray-600">Search first. See the relationship history before contacting anyone.</p></div>
        <Link href="/internal/sales/import-review" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">Review imports</Link>
      </div>

      <SalesMemorySearch entries={searchEntries} />

      <div className="mt-4 flex justify-end">
        <details>
          <summary className="cursor-pointer list-none text-sm font-medium text-gray-500 hover:text-gray-800">+ Add organization manually</summary>
          <section className="mt-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <form method="post" action="/api/internal/sales" className="grid gap-3 md:grid-cols-4">
              <input type="hidden" name="action" value="create_organization" />
              <input required name="name" placeholder="Organization name" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input name="domain" placeholder="Domain" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input name="country" placeholder="Country" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">Add organization</button>
            </form>
          </section>
        </details>
      </div>

      <div className="mt-7 flex items-baseline justify-between gap-4"><div><h2 className="text-base font-semibold">Organizations</h2><p className="mt-1 text-xs text-gray-500">Most recently active first.</p></div><span className="text-xs text-gray-500">{organizations.length} total</span></div>
      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {organizations.length === 0 ? <p className="p-6 text-sm text-gray-600">No organizations found.</p> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Organization</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Projects</th><th className="px-5 py-3">Last interaction</th><th className="px-5 py-3"><span className="sr-only">Action</span></th></tr></thead>
          <tbody className="divide-y divide-gray-100">{organizations.map((organization) => <tr key={organization.id} className={organization.doNotContact ? "bg-red-50/50" : "hover:bg-gray-50"}>
            <td className="px-5 py-4"><div className="font-medium text-gray-900">{organization.name}</div><div className="text-xs text-gray-500">{organization.domain || "No domain"}</div></td>
            <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(organization.status)}`}>{organization.status}</span>{organization.doNotContact ? <div className="mt-1 text-xs font-semibold text-red-700">DO NOT CONTACT</div> : null}</td>
            <td className="px-5 py-4">{organization.projectCount || 0}</td>
            <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(organization.lastInteractionAt)}</td>
            <td className="px-5 py-4 text-right"><Link href={`/internal/sales/organizations/${organization.id}`} className="font-medium text-forest-700 hover:text-forest-800">Open →</Link></td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </div></main>
  </>;
}
