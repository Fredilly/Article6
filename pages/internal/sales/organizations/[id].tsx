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

export default function OrganizationPage({ detail, duplicate, error }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { organization, contacts, projects, interactions } = detail;
  return <>
    <Head><title>{organization.name} | Sales Memory</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <Link href="/internal/sales" className="text-sm font-medium text-forest-700">← Sales memory</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1><p className="mt-1 text-sm text-gray-600">{organization.domain || "No domain recorded"}{organization.country ? ` · ${organization.country}` : ""}</p></div>
        <div className="text-right"><div className="text-sm font-semibold">{organization.status}</div>{organization.doNotContact ? <div className="mt-1 rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">DO NOT CONTACT</div> : null}</div>
      </div>
      {duplicate ? <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Duplicate prevented. This existing organization matched the name or domain you entered.</div> : null}
      {error ? <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Current disposition</h2>
        <form method="post" action="/api/internal/sales" className="mt-4 grid gap-3 md:grid-cols-3">
          <input type="hidden" name="action" value="update_status" /><input type="hidden" name="organizationId" value={organization.id} />
          <select name="status" defaultValue={organization.status} className={fieldClass}>{SALES_ORGANIZATION_STATUSES.map((value) => <option key={value}>{value}</option>)}</select>
          <select name="objectionCode" defaultValue={organization.objectionCode || ""} className={fieldClass}><option value="">No objection</option>{SALES_OBJECTION_CODES.map((value) => <option key={value}>{value}</option>)}</select>
          <select name="internalCertificationTeam" defaultValue={organization.internalCertificationTeam == null ? "" : String(organization.internalCertificationTeam)} className={fieldClass}><option value="">Internal team unknown</option><option value="true">Internal team: yes</option><option value="false">Internal team: no</option></select>
          <textarea name="notes" defaultValue={organization.notes} placeholder="Organization notes" className={`${fieldClass} md:col-span-2`} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="doNotContact" defaultChecked={organization.doNotContact} /> Do not contact</label>
          <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white md:col-span-3">Update disposition</button>
        </form>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Contacts</h2>
          <div className="mt-3 space-y-3">{contacts.length ? contacts.map((contact) => <div key={contact.id} className="rounded-md border border-gray-100 p-3 text-sm"><div className="font-medium">{contact.name}</div><div className="text-gray-600">{contact.title || "No title"}</div><div className="mt-1 text-xs text-gray-500">{contact.email || contact.phone || "No contact details"}</div></div>) : <p className="text-sm text-gray-500">No contacts yet.</p>}</div>
          <form method="post" action="/api/internal/sales" className="mt-4 grid gap-2"><input type="hidden" name="action" value="add_contact" /><input type="hidden" name="organizationId" value={organization.id} /><input required name="name" placeholder="Name" className={fieldClass} /><input name="title" placeholder="Title" className={fieldClass} /><input name="email" type="email" placeholder="Email" className={fieldClass} /><input name="phone" placeholder="Phone" className={fieldClass} /><button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white">Add contact</button></form>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Projects</h2>
          <div className="mt-3 space-y-3">{projects.length ? projects.map((project) => <div key={project.id} className="rounded-md border border-gray-100 p-3 text-sm"><div className="font-medium">{project.name}</div><div className="text-gray-600">{project.vcsId ? `VCS ${project.vcsId}` : "No VCS ID"}{project.methodology ? ` · ${project.methodology}${project.methodologyVersion ? ` ${project.methodologyVersion}` : ""}` : ""}</div><div className="mt-1 text-xs text-gray-500">Role: {project.role || "OTHER"}{project.vvb ? ` · VVB: ${project.vvb}` : ""}</div></div>) : <p className="text-sm text-gray-500">No projects yet.</p>}</div>
          <form method="post" action="/api/internal/sales" className="mt-4 grid gap-2"><input type="hidden" name="action" value="add_project" /><input type="hidden" name="organizationId" value={organization.id} /><input required name="name" placeholder="Project name" className={fieldClass} /><input name="vcsId" placeholder="VCS ID" className={fieldClass} /><div className="grid grid-cols-2 gap-2"><input name="methodology" placeholder="Methodology" className={fieldClass} /><input name="methodologyVersion" placeholder="Version" className={fieldClass} /></div><input name="vvb" placeholder="VVB" className={fieldClass} /><input name="role" placeholder="Organization role" className={fieldClass} /><button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white">Add / link project</button></form>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Log interaction</h2>
        <form method="post" action="/api/internal/sales" className="mt-4 grid gap-3 md:grid-cols-3"><input type="hidden" name="action" value="add_interaction" /><input type="hidden" name="organizationId" value={organization.id} />
          <select name="contactId" className={fieldClass}><option value="">No contact</option>{contacts.map((contact) => <option value={contact.id} key={contact.id}>{contact.name}</option>)}</select>
          <select name="projectId" className={fieldClass}><option value="">No project</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
          <input name="occurredAt" type="datetime-local" required className={fieldClass} />
          <select name="channel" className={fieldClass}><option>EMAIL</option><option>WHATSAPP</option><option>PHONE</option><option>MEETING</option><option>LINKEDIN</option><option>OTHER</option></select>
          <select name="direction" className={fieldClass}><option>OUTBOUND</option><option>INBOUND</option><option>INTERNAL</option></select>
          <select name="interactionType" className={fieldClass}><option>MESSAGE</option><option>REPLY</option><option>CALL</option><option>MEETING</option><option>NOTE</option><option>REFERRAL</option></select>
          <input name="subject" placeholder="Subject / short label" className={`${fieldClass} md:col-span-2`} /><input name="outcomeCode" placeholder="Outcome code" className={fieldClass} />
          <textarea required name="summary" placeholder="What happened? Keep this factual." className={`${fieldClass} md:col-span-3`} />
          <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white md:col-span-3">Log interaction</button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Interaction timeline</h2>
        <div className="mt-4 space-y-4">{interactions.length ? interactions.map((interaction) => <article key={interaction.id} className="border-l-2 border-gray-200 pl-4"><div className="flex flex-wrap items-center gap-2 text-xs text-gray-500"><span>{new Date(interaction.occurredAt).toLocaleString()}</span><span>{interaction.direction} · {interaction.channel} · {interaction.interactionType}</span>{interaction.outcomeCode ? <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">{interaction.outcomeCode}</span> : null}</div><div className="mt-1 text-sm font-medium text-gray-900">{interaction.subject || interaction.contactName || "Interaction"}</div><p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{interaction.summary}</p><div className="mt-1 text-xs text-gray-500">{[interaction.contactName, interaction.projectName].filter(Boolean).join(" · ")}</div></article>) : <p className="text-sm text-gray-500">No interactions yet.</p>}</div>
      </section>
    </div></main>
  </>;
}
