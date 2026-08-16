import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getSalesOrganizationDetail, type SalesOrganizationDetail } from "../../../../lib/sales-store";
import { SALES_OBJECTION_CODES, SALES_ORGANIZATION_STATUSES } from "../../../../lib/sales-memory";

interface Props { detail: SalesOrganizationDetail; duplicate: boolean; error?: string; }

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, query }) => {
  const id = typeof params?.id === "string" ? params.id : "";
  const detail = await getSalesOrganizationDetail(id);
  if (!detail) return { notFound: true };
  return { props: { detail, duplicate: query.duplicate === "1", error: typeof query.error === "string" ? query.error : undefined } };
};

const fieldClass = "rounded-md border border-gray-300 px-3 py-2 text-sm";

function websiteHref(domain?: string): string | undefined {
  if (!domain) return undefined;
  return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
}

export default function OrganizationPage({ detail, duplicate, error }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { organization, contacts, projects, interactions } = detail;
  const website = websiteHref(organization.domain);

  return <>
    <Head><title>{organization.name} | Sales Memory</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <Link href="/internal/sales" className="text-sm font-medium text-forest-700">← Sales memory</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1><p className="mt-1 text-sm text-gray-600">{organization.domain || "No domain recorded"}{organization.country ? ` · ${organization.country}` : ""}</p></div>
        <div className="text-right"><div className="text-sm font-semibold">{organization.status}</div>{organization.objectionCode ? <div className="mt-1 text-xs text-gray-500">{organization.objectionCode}</div> : null}{organization.doNotContact ? <div className="mt-2 rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">DO NOT CONTACT</div> : null}</div>
      </div>
      {duplicate ? <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Duplicate prevented. This existing organization matched the name or domain you entered.</div> : null}
      {error ? <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <section className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Account overview</h2>
        </div>
        <div className="grid gap-px bg-gray-100 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white px-5 py-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Company</div>
            <div className="mt-1 text-base font-semibold text-gray-900">{organization.name}</div>
          </div>
          <div className="bg-white px-5 py-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Website</div>
            {website ? <a href={website} target="_blank" rel="noreferrer" className="mt-1 block text-base font-semibold text-forest-700 hover:underline">{organization.domain}</a> : <div className="mt-1 text-base font-semibold text-gray-500">Not recorded</div>}
          </div>
          <div className="bg-white px-5 py-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Projects</div>
            <div className="mt-1 text-base font-semibold text-gray-900">{projects.length}</div>
          </div>
          <div className="bg-white px-5 py-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Interactions</div>
            <div className="mt-1 text-base font-semibold text-gray-900">{interactions.length}</div>
          </div>
        </div>

        <div className="border-t border-gray-100">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-4 bg-gray-50 px-5 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid">
            <div>Project</div><div>Project ID</div><div>Methodology</div><div>Version</div>
          </div>
          {projects.length ? projects.map((project) => <div key={project.id} className="grid gap-3 border-t border-gray-100 px-5 py-4 first:border-t-0 md:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)] md:items-center md:gap-4">
            <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Project</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.name}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Project ID</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.vcsId ? `VCS ${project.vcsId}` : "Not recorded"}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Methodology</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.methodology || "Not recorded"}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Version</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.methodologyVersion || "Not recorded"}</div></div>
          </div>) : <div className="px-5 py-4 text-sm text-gray-500">No projects recorded.</div>}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Relationship history</h2><p className="mt-1 text-xs text-gray-500">Newest interaction first.</p></div><div className="text-xs text-gray-500">{interactions.length} interactions</div></div>
        <div className="mt-5 space-y-5">{interactions.length ? interactions.map((interaction) => <article key={interaction.id} className="border-l-2 border-gray-200 pl-4"><div className="flex flex-wrap items-center gap-2 text-xs text-gray-500"><span>{new Date(interaction.occurredAt).toLocaleString()}</span><span>{interaction.direction} · {interaction.channel} · {interaction.interactionType}</span>{interaction.outcomeCode ? <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">{interaction.outcomeCode}</span> : null}</div><div className="mt-1 text-sm font-medium text-gray-900">{interaction.subject || interaction.contactName || "Interaction"}</div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{interaction.summary}</p><div className="mt-1 text-xs text-gray-500">{[interaction.contactName, interaction.projectName].filter(Boolean).join(" · ")}</div></article>) : <p className="text-sm text-gray-500">No interactions yet.</p>}</div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Contacts <span className="ml-1 text-xs font-normal text-gray-500">({contacts.length})</span></h2>
          <div className="mt-3 space-y-3">{contacts.length ? contacts.map((contact) => <div key={contact.id} className="rounded-md border border-gray-100 p-3 text-sm"><div className="font-medium">{contact.name}</div><div className="text-gray-600">{contact.title || "No title"}</div><div className="mt-1 text-xs text-gray-500">{contact.email || contact.phone || "No contact details"}</div></div>) : <p className="text-sm text-gray-500">No contacts yet.</p>}</div>
          <details className="mt-4"><summary className="cursor-pointer list-none text-sm font-medium text-forest-700">+ Add contact</summary><form method="post" action="/api/internal/sales" className="mt-3 grid gap-2"><input type="hidden" name="action" value="add_contact" /><input type="hidden" name="organizationId" value={organization.id} /><input required name="name" placeholder="Name" className={fieldClass} /><input name="title" placeholder="Title" className={fieldClass} /><input name="email" type="email" placeholder="Email" className={fieldClass} /><input name="phone" placeholder="Phone" className={fieldClass} /><button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white">Add contact</button></form></details>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Projects <span className="ml-1 text-xs font-normal text-gray-500">({projects.length})</span></h2>
          <div className="mt-3 space-y-3">{projects.length ? projects.map((project) => <div key={project.id} className="rounded-md border border-gray-100 p-3 text-sm"><div className="font-medium">{project.name}</div><div className="text-gray-600">{project.vcsId ? `VCS ${project.vcsId}` : "No VCS ID"}{project.methodology ? ` · ${project.methodology}${project.methodologyVersion ? ` ${project.methodologyVersion}` : ""}` : ""}</div><div className="mt-1 text-xs text-gray-500">Role: {project.role || "OTHER"}{project.vvb ? ` · VVB: ${project.vvb}` : ""}</div></div>) : <p className="text-sm text-gray-500">No projects yet.</p>}</div>
          <details className="mt-4"><summary className="cursor-pointer list-none text-sm font-medium text-forest-700">+ Add / link project</summary><form method="post" action="/api/internal/sales" className="mt-3 grid gap-2"><input type="hidden" name="action" value="add_project" /><input type="hidden" name="organizationId" value={organization.id} /><input required name="name" placeholder="Project name" className={fieldClass} /><input name="vcsId" placeholder="VCS ID" className={fieldClass} /><div className="grid grid-cols-2 gap-2"><input name="methodology" placeholder="Methodology" className={fieldClass} /><input name="methodologyVersion" placeholder="Version" className={fieldClass} /></div><input name="vvb" placeholder="VVB" className={fieldClass} /><input name="role" placeholder="Organization role" className={fieldClass} /><button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white">Add / link project</button></form></details>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <details className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer list-none font-semibold">Update disposition <span className="ml-2 text-xs font-normal text-gray-500">secondary</span></summary>
          <form method="post" action="/api/internal/sales" className="mt-4 grid gap-3"><input type="hidden" name="action" value="update_status" /><input type="hidden" name="organizationId" value={organization.id} /><select name="status" defaultValue={organization.status} className={fieldClass}>{SALES_ORGANIZATION_STATUSES.map((value) => <option key={value}>{value}</option>)}</select><select name="objectionCode" defaultValue={organization.objectionCode || ""} className={fieldClass}><option value="">No objection</option>{SALES_OBJECTION_CODES.map((value) => <option key={value}>{value}</option>)}</select><select name="internalCertificationTeam" defaultValue={organization.internalCertificationTeam == null ? "" : String(organization.internalCertificationTeam)} className={fieldClass}><option value="">Internal team unknown</option><option value="true">Internal team: yes</option><option value="false">Internal team: no</option></select><textarea name="notes" defaultValue={organization.notes} placeholder="Organization notes" className={fieldClass} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="doNotContact" defaultChecked={organization.doNotContact} /> Do not contact</label><button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">Update disposition</button></form>
        </details>

        <details className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer list-none font-semibold">Log interaction <span className="ml-2 text-xs font-normal text-gray-500">manual</span></summary>
          <form method="post" action="/api/internal/sales" className="mt-4 grid gap-3"><input type="hidden" name="action" value="add_interaction" /><input type="hidden" name="organizationId" value={organization.id} /><select name="contactId" className={fieldClass}><option value="">No contact</option>{contacts.map((contact) => <option value={contact.id} key={contact.id}>{contact.name}</option>)}</select><select name="projectId" className={fieldClass}><option value="">No project</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select><input name="occurredAt" type="datetime-local" required className={fieldClass} /><select name="channel" className={fieldClass}><option>EMAIL</option><option>WHATSAPP</option><option>PHONE</option><option>MEETING</option><option>LINKEDIN</option><option>OTHER</option></select><select name="direction" className={fieldClass}><option>OUTBOUND</option><option>INBOUND</option><option>INTERNAL</option></select><select name="interactionType" className={fieldClass}><option>MESSAGE</option><option>REPLY</option><option>CALL</option><option>MEETING</option><option>NOTE</option><option>REFERRAL</option></select><input name="subject" placeholder="Subject / short label" className={fieldClass} /><input name="outcomeCode" placeholder="Outcome code" className={fieldClass} /><textarea required name="summary" placeholder="What happened? Keep this factual." className={fieldClass} /><button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">Log interaction</button></form>
        </details>
      </div>
    </div></main>
  </>;
}
