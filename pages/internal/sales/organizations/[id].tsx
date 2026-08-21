import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import SalesHeader from "../../../../components/SalesHeader";
import { buildSalesMemorySearchEntries } from "../../../../lib/sales-search";
import { listSalesOrganizations } from "../../../../lib/sales-store";
import { getSalesOrganizationDetail, type SalesOrganizationDetail } from "../../../../lib/sales-store";
import { SALES_EXPERIMENTS, SALES_OBJECTION_CODES, SALES_ORGANIZATION_STATUSES } from "../../../../lib/sales-memory";
import { relationshipHistoryPresentation } from "../../../../lib/sales-interaction-display";
import { groupSalesInteractions } from "../../../../lib/sales-conversations";

interface Props { detail: SalesOrganizationDetail; duplicate: boolean; error?: string; searchEntries: ReturnType<typeof buildSalesMemorySearchEntries>; initialQuery: string; initialStatus: "ALL" | SalesOrganizationDetail["organization"]["status"]; selectedContactId?: string; selectedConversationId?: string; }

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, query }) => {
  const id = typeof params?.id === "string" ? params.id : "";
  const detail = await getSalesOrganizationDetail(id);
  if (!detail) return { notFound: true };
  const organizations = await listSalesOrganizations("");
  const details = (await Promise.all(organizations.map((organization) => getSalesOrganizationDetail(organization.id)))).filter((value): value is NonNullable<typeof value> => Boolean(value));
  const rawStatus = typeof query.status === "string" ? query.status : "ALL";
  const initialStatus = rawStatus === "ALL" || detail.organization.status === rawStatus ? rawStatus as Props["initialStatus"] : "ALL";
  return { props: { detail, duplicate: query.duplicate === "1", error: typeof query.error === "string" ? query.error : undefined, searchEntries: buildSalesMemorySearchEntries(details), initialQuery: typeof query.q === "string" ? query.q : "", initialStatus, selectedContactId: typeof query.contactId === "string" ? query.contactId : undefined, selectedConversationId: typeof query.threadId === "string" ? query.threadId : undefined } };
};

const fieldClass = "rounded-md border border-gray-300 px-3 py-2 text-sm";

function websiteHref(domain?: string): string | undefined {
  if (!domain) return undefined;
  return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
}

function experimentLabel(value: string) {
  if (value === "ARTICLE6_CARBON") return "Article6 Carbon";
  if (value === "TENDER_READINESS") return "Tender Readiness";
  if (value === "ECOVADIS_SUPPLIER_COMPLIANCE") return "EcoVadis / Supplier Compliance";
  return "Other";
}

export default function OrganizationPage({ detail, duplicate, error, searchEntries, initialQuery, initialStatus, selectedContactId, selectedConversationId }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { organization, contacts, projects, interactions } = detail;
  const allConversations = groupSalesInteractions(interactions);
  const conversations = allConversations.filter((conversation) => (!selectedContactId || conversation.contactId === selectedContactId) && (!selectedConversationId || conversation.id === selectedConversationId));
  const website = websiteHref(organization.domain);

  return <>
    <Head><title>{organization.name} | Sales Memory</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <Link href="/internal/sales" className="text-sm font-medium text-forest-700">← Sales memory</Link>
      <SalesHeader entries={searchEntries} initialQuery={initialQuery} initialStatus={initialStatus} />
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1><p className="mt-1 text-sm text-gray-600">{organization.domain || "No domain recorded"}{organization.country ? ` · ${organization.country}` : ""}</p><div className="mt-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{experimentLabel(organization.experiment)}</span></div></div>
        <div className="text-right"><div className="text-sm font-semibold">{organization.status}</div>{organization.objectionCode ? <div className="mt-1 text-xs text-gray-500">{organization.objectionCode}</div> : null}{organization.doNotContact ? <div className="mt-2 rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">DO NOT CONTACT</div> : null}</div>
      </div>
      {duplicate ? <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Duplicate prevented. This existing organization matched the name or domain you entered.</div> : null}
      {error ? <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <section className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3"><h2 className="text-sm font-semibold text-gray-900">Account overview</h2></div>
        <div className="grid gap-px bg-gray-100 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Company</div><div className="mt-1 text-base font-semibold text-gray-900">{organization.name}</div></div>
          <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Website</div>{website ? <a href={website} target="_blank" rel="noreferrer" className="mt-1 block text-base font-semibold text-forest-700 hover:underline">{organization.domain}</a> : <div className="mt-1 text-base font-semibold text-gray-500">Not recorded</div>}</div>
          <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Projects</div><div className="mt-1 text-base font-semibold text-gray-900">{projects.length}</div></div>
          <div className="bg-white px-5 py-4"><div className="text-xs font-medium uppercase tracking-wide text-gray-500">Interactions</div><div className="mt-1 text-base font-semibold text-gray-900">{interactions.length}</div></div>
        </div>

        <div className="border-t border-gray-100">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-4 bg-gray-50 px-5 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid"><div>Project</div><div>Project ID</div><div>Methodology</div><div>Version</div></div>
          {projects.length ? projects.map((project) => <div key={project.id} className="grid gap-3 border-t border-gray-100 px-5 py-4 first:border-t-0 md:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)] md:items-center md:gap-4">
            <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Project</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.name}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Project ID</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.vcsId ? `VCS ${project.vcsId}` : "Not recorded"}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Methodology</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.methodology || "Not recorded"}</div></div>
            <div><div className="text-xs font-medium uppercase tracking-wide text-gray-500 md:hidden">Version</div><div className="mt-1 text-sm font-semibold text-gray-900 md:mt-0">{project.methodologyVersion || "Not recorded"}</div></div>
          </div>) : <div className="px-5 py-4 text-sm text-gray-500">No projects recorded.</div>}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Relationship history</h2><p className="mt-1 text-xs text-gray-500">{selectedContactId || selectedConversationId ? "Conversation view · oldest message first." : "Organization activity grouped by conversation."}</p></div><div className="text-xs text-gray-500">{conversations.reduce((count, conversation) => count + conversation.interactions.length, 0)} messages · {conversations.length} conversations</div></div>
        <div className="mt-5 space-y-6">{conversations.length ? conversations.map((conversation) => <section key={conversation.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4"><div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3"><div><div className="text-sm font-semibold text-gray-900">{conversation.contactName || "Conversation"}</div><div className="mt-1 text-xs text-gray-500">{conversation.subject || "No subject"} · {conversation.interactions.length} messages</div></div>{selectedConversationId === conversation.id ? <Link href={`/internal/sales/organizations/${organization.id}`} className="text-xs font-medium text-forest-700 hover:underline">All conversations</Link> : <Link href={`/internal/sales/organizations/${organization.id}?threadId=${encodeURIComponent(conversation.id)}`} className="text-xs font-medium text-forest-700 hover:underline">Open conversation</Link>}</div><div className="mt-4 space-y-5">{conversation.interactions.map((interaction) => {
          const presentation = relationshipHistoryPresentation(interaction.direction, interaction.contactName);
          return <article key={interaction.id} className={`flex ${presentation.alignment === "right" ? "justify-end" : "justify-start"}`}><div className={`w-full max-w-3xl rounded-lg border px-4 py-3 ${presentation.alignment === "right" ? "border-blue-100 bg-blue-50" : "border-gray-200 bg-gray-50"}`}><div className="flex flex-wrap items-center gap-2 text-xs text-gray-500"><span>{new Date(interaction.occurredAt).toLocaleString()}</span><span>{presentation.direction} · {interaction.channel} · {interaction.interactionType}</span>{interaction.outcomeCode ? <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">{interaction.outcomeCode}</span> : null}</div><div className="mt-1 text-sm font-medium text-gray-900">{interaction.subject || "Interaction"}</div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{interaction.summary}</p></div></article>;
        })}</div></section>) : <p className="text-sm text-gray-500">No conversations yet.</p>}</div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Contacts <span className="ml-1 text-xs font-normal text-gray-500">({contacts.length})</span></h2>
          <div className="mt-3 space-y-3">{contacts.length ? contacts.map((contact) => <div key={contact.id} className="rounded-md border border-gray-100 p-3 text-sm"><div className="flex items-start justify-between gap-2"><div className="font-medium">{contact.name}</div><Link href={`/internal/sales/organizations/${organization.id}?contactId=${encodeURIComponent(contact.id)}`} className="text-xs font-medium text-forest-700 hover:underline">View history</Link></div><div className="text-gray-600">{contact.title || "No title"}</div><div className="mt-1 text-xs text-gray-500">
            {contact.email ? <div>Email: {contact.email}</div> : null}
            {contact.phone ? <div>Phone: {contact.phone}</div> : null}
            {!contact.email && !contact.phone ? "No contact details" : null}
          </div></div>) : <p className="text-sm text-gray-500">No contacts yet.</p>}</div>
          <details className="mt-4"><summary className="cursor-pointer list-none text-sm font-medium text-forest-700">+ Add contact</summary><form method="post" action="/api/internal/sales" className="mt-3 grid gap-2"><input type="hidden" name="action" value="add_contact" /><input type="hidden" name="organizationId" value={organization.id} /><input required name="name" placeholder="Name" className={fieldClass} /><input name="title" placeholder="Title" className={fieldClass} /><input name="email" type="email" placeholder="Email" className={fieldClass} /><input name="phone" placeholder="Phone" className={fieldClass} /><button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white">Add contact</button></form></details>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Projects <span className="ml-1 text-xs font-normal text-gray-500">({projects.length})</span></h2>
          <div className="mt-3 space-y-3">{projects.length ? projects.map((project) => <div key={project.id} className="rounded-md border border-gray-100 p-3 text-sm"><div className="font-medium">{project.name}</div><div className="text-gray-600">{project.vcsId ? `VCS ${project.vcsId}` : "No VCS ID"}{project.methodology ? ` · ${project.methodology}${project.methodologyVersion ? ` ${project.methodologyVersion}` : ""}` : ""}</div><div className="mt-1 text-xs text-gray-500">Role: {project.role || "OTHER"}{project.vvb ? ` · VVB: ${project.vvb}` : ""}</div></div>) : <p className="text-sm text-gray-500">No projects yet.</p>}</div>
          <details className="mt-4"><summary className="cursor-pointer list-none text-sm font-medium text-forest-700">+ Add / link project</summary><form method="post" action="/api/internal/sales" className="mt-3 grid gap-2"><input type="hidden" name="action" value="add_project" /><input type="hidden" name="organizationId" value={organization.id} /><input required name="name" placeholder="Project name" className={fieldClass} /><input name="vcsId" placeholder="VCS ID" className={fieldClass} /><div className="grid grid-cols-2 gap-2"><input name="methodology" placeholder="Methodology" className={fieldClass} /><input name="methodologyVersion" placeholder="Version" className={fieldClass} /></div><input name="vvb" placeholder="VVB" className={fieldClass} /><input name="role" placeholder="Organization role" className={fieldClass} /><button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white">Add / link project</button></form></details>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <details className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer list-none font-semibold">Update disposition <span className="ml-2 text-xs font-normal text-gray-500">secondary</span></summary>
          <form method="post" action="/api/internal/sales" className="mt-4 grid gap-3"><input type="hidden" name="action" value="update_status" /><input type="hidden" name="organizationId" value={organization.id} /><select name="experiment" defaultValue={organization.experiment} className={fieldClass}>{SALES_EXPERIMENTS.map((value) => <option key={value} value={value}>{experimentLabel(value)}</option>)}</select><select name="status" defaultValue={organization.status} className={fieldClass}>{SALES_ORGANIZATION_STATUSES.map((value) => <option key={value}>{value}</option>)}</select><select name="objectionCode" defaultValue={organization.objectionCode || ""} className={fieldClass}><option value="">No objection</option>{SALES_OBJECTION_CODES.map((value) => <option key={value}>{value}</option>)}</select><select name="internalCertificationTeam" defaultValue={organization.internalCertificationTeam == null ? "" : String(organization.internalCertificationTeam)} className={fieldClass}><option value="">Internal team unknown</option><option value="true">Internal team: yes</option><option value="false">Internal team: no</option></select><textarea name="notes" defaultValue={organization.notes} placeholder="Organization notes" className={fieldClass} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="doNotContact" defaultChecked={organization.doNotContact} /> Do not contact</label><button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">Update disposition</button></form>
        </details>

        <details className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer list-none font-semibold">Log interaction <span className="ml-2 text-xs font-normal text-gray-500">manual</span></summary>
          <form method="post" action="/api/internal/sales" className="mt-4 grid gap-3"><input type="hidden" name="action" value="add_interaction" /><input type="hidden" name="organizationId" value={organization.id} /><select name="contactId" className={fieldClass}><option value="">No contact</option>{contacts.map((contact) => <option value={contact.id} key={contact.id}>{contact.name}</option>)}</select><select name="projectId" className={fieldClass}><option value="">No project</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select><input name="occurredAt" type="datetime-local" required className={fieldClass} /><select name="channel" className={fieldClass}><option>EMAIL</option><option>WHATSAPP</option><option>PHONE</option><option>MEETING</option><option>LINKEDIN</option><option>OTHER</option></select><select name="direction" className={fieldClass}><option>OUTBOUND</option><option>INBOUND</option><option>INTERNAL</option></select><select name="interactionType" className={fieldClass}><option>MESSAGE</option><option>REPLY</option><option>CALL</option><option>MEETING</option><option>NOTE</option><option>REFERRAL</option></select><input name="subject" placeholder="Subject / short label" className={fieldClass} /><input name="outcomeCode" placeholder="Outcome code" className={fieldClass} /><textarea required name="summary" placeholder="What happened? Keep this factual." className={fieldClass} /><button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">Log interaction</button></form>
        </details>
      </div>
    </div></main>
  </>;
}
