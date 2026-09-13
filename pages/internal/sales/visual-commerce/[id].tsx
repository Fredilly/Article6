import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import SalesAutoRefresh from "../../../../components/SalesAutoRefresh";
import SalesHeader from "../../../../components/SalesHeader";
import { loadSalesHomepageData } from "../../../../lib/sales-homepage-store";
import { buildSalesMemorySearchEntries } from "../../../../lib/sales-search";
import { groupSalesInteractions } from "../../../../lib/sales-conversations";
import { getSalesOrganizationDetail, type SalesOrganizationDetail } from "../../../../lib/sales-store";
import { SALES_ORGANIZATION_STATUSES } from "../../../../lib/sales-memory";
import { getSalesVisualCommerceContacts, getSalesVisualCommerceProfile, type SalesVisualCommerceContact, type SalesVisualCommerceProfile } from "../../../../lib/sales-visual-commerce";

interface Props {
  detail: SalesOrganizationDetail;
  profile: SalesVisualCommerceProfile | null;
  contacts: SalesVisualCommerceContact[];
  searchEntries: ReturnType<typeof buildSalesMemorySearchEntries>;
  initialQuery: string;
  initialStatus: "ALL" | SalesOrganizationDetail["organization"]["status"];
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, query }) => {
  const id = typeof params?.id === "string" ? params.id : "";
  const [detail, homepageData] = await Promise.all([getSalesOrganizationDetail(id), loadSalesHomepageData()]);
  if (!detail || detail.organization.experiment !== "VISUAL_COMMERCE") return { notFound: true };
  const [profile, contacts] = await Promise.all([getSalesVisualCommerceProfile(id), getSalesVisualCommerceContacts(id)]);
  const rawStatus = typeof query.status === "string" ? query.status : "ALL";
  const initialStatus = rawStatus === "ALL" || detail.organization.status === rawStatus ? rawStatus as Props["initialStatus"] : "ALL";
  return {
    props: {
      detail,
      profile,
      contacts,
      searchEntries: buildSalesMemorySearchEntries(homepageData.details),
      initialQuery: typeof query.q === "string" ? query.q : "",
      initialStatus,
    },
  };
};

const fieldClass = "rounded-md border border-gray-300 px-3 py-2 text-sm";
function show(value?: string) { return value?.trim() || "Not recorded"; }
function label(value?: string) { return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Not recorded"; }
function when(value?: string) { return value ? new Date(value).toLocaleString() : "Not recorded"; }
function LinkValue({ value }: { value?: string }) {
  if (!value) return <span className="text-gray-500">Not recorded</span>;
  const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return <a href={href} target="_blank" rel="noreferrer" className="text-forest-700 hover:underline">{value}</a>;
}
function Field({ name, children }: { name: string; children: ReactNode }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{name}</dt><dd className="mt-1 font-medium text-gray-900">{children}</dd></div>;
}

export default function VisualCommerceOrganizationPage({ detail, profile, contacts, searchEntries, initialQuery, initialStatus }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { organization, interactions } = detail;
  const lastInteraction = interactions.length ? interactions[interactions.length - 1]?.occurredAt : undefined;
  const conversations = groupSalesInteractions(interactions);
  const metadataById = new Map(contacts.map((contact) => [contact.id, contact]));

  return <>
    <Head><title>{organization.name} | Sales Memory</title><meta name="robots" content="noindex,nofollow" /></Head>
    <SalesAutoRefresh />
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <Link href="/internal/sales" className="text-sm font-medium text-forest-700">← Sales memory</Link>
      <SalesHeader entries={searchEntries} initialQuery={initialQuery} initialStatus={initialStatus} />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1><p className="mt-1 text-sm text-gray-600">{organization.domain || "No domain"}{organization.country ? ` · ${organization.country}` : ""}</p><span className="mt-2 inline-block rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-semibold text-fuchsia-700">Visual Commerce</span></div><div className="text-right"><div className="text-sm font-semibold">{organization.status}</div>{organization.doNotContact ? <div className="mt-2 rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">DO NOT CONTACT</div> : null}</div></div>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Overview</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Field name="Company">{organization.name}</Field><Field name="Website"><LinkValue value={profile?.websiteUrl || organization.domain} /></Field><Field name="Country">{show(organization.country)}</Field><Field name="Category">{show(profile?.primaryCategory)}</Field><Field name="Customer type">{label(profile?.customerType)}</Field><Field name="Priority">{show(profile?.priority)}</Field><Field name="Status">{organization.status}</Field><Field name="Last interaction">{when(lastInteraction)}</Field>
      </dl></section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold">Visual Commerce Opportunity</h2><span className="text-xs text-gray-500">Last researched: {when(profile?.lastResearchedAt)}</span></div><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Field name="YouTube"><LinkValue value={profile?.youtubeUrl} /></Field><Field name="Instagram"><LinkValue value={profile?.instagramUrl} /></Field><Field name="TikTok"><LinkValue value={profile?.tiktokUrl} /></Field><Field name="Video presence">{label(profile?.videoPresence)}</Field><Field name="Existing video commerce">{label(profile?.existingVideoCommerce)}</Field><Field name="Existing affiliate activity">{label(profile?.existingAffiliateActivity)}</Field><Field name="Visual product fit">{label(profile?.visualProductFit)}</Field><Field name="Target customer gender">{show(profile?.targetCustomerGender)}</Field><Field name="Source"><LinkValue value={profile?.sourceUrl} /></Field>
        <div className="sm:col-span-2 lg:col-span-3"><Field name="VCL use case">{show(profile?.vclUseCase)}</Field></div><div className="sm:col-span-2 lg:col-span-3"><Field name="Value hypothesis">{show(profile?.valueHypothesis)}</Field></div><div className="sm:col-span-2 lg:col-span-3"><Field name="Monetization hypothesis">{show(profile?.monetizationHypothesis)}</Field></div><div className="sm:col-span-2 lg:col-span-3"><Field name="Qualification notes">{show(profile?.qualificationNotes)}</Field></div>
      </dl></section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Contacts <span className="ml-1 text-xs font-normal text-gray-500">({detail.contacts.length})</span></h2>
          <div className="mt-3 space-y-3">{detail.contacts.length ? detail.contacts.map((contact) => { const metadata = metadataById.get(contact.id); return <div key={contact.id} className="rounded-md border border-gray-100 p-3 text-sm"><div className="flex items-start justify-between gap-2"><div><div className="font-medium">{contact.name}</div><div className="text-gray-600">{contact.title || "No title"}</div></div><Link href={`/internal/sales/visual-commerce/${organization.id}?contactId=${encodeURIComponent(contact.id)}`} className="text-xs font-medium text-forest-700 hover:underline">View history</Link></div><div className="mt-2 grid gap-1 text-xs text-gray-500 sm:grid-cols-2"><div>Email: {contact.email || "Not recorded"}</div><div>Email type: {metadata?.emailType || "Not recorded"}</div><div>Phone: {contact.phone || "Not recorded"}</div><div>WhatsApp: {metadata?.whatsapp || "Not recorded"}</div></div>
            <details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-forest-700 hover:underline">Edit contact</summary><form method="post" action="/api/internal/sales" className="mt-2 grid gap-2 rounded border border-gray-200 bg-gray-50 p-2"><input type="hidden" name="action" value="update_contact" /><input type="hidden" name="organizationId" value={organization.id} /><input type="hidden" name="contactId" value={contact.id} /><input required name="name" defaultValue={contact.name} className={fieldClass} /><input name="title" defaultValue={contact.title} placeholder="Title" className={fieldClass} /><input name="email" type="email" defaultValue={contact.email} placeholder="Email" className={fieldClass} /><input name="phone" defaultValue={contact.phone} placeholder="Phone" className={fieldClass} /><textarea name="notes" defaultValue={contact.notes} placeholder="Notes" className={fieldClass} /><button className="rounded bg-forest-700 px-3 py-2 text-xs font-medium text-white">Save contact</button></form></details>
            <details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-forest-700 hover:underline">Edit VCL contact metadata</summary><form method="post" action="/api/internal/visual-commerce" className="mt-2 grid gap-2 rounded border border-gray-200 bg-gray-50 p-2"><input type="hidden" name="action" value="update_contact_metadata" /><input type="hidden" name="organizationId" value={organization.id} /><input type="hidden" name="contactId" value={contact.id} /><select name="emailType" defaultValue={metadata?.emailType || ""} className={fieldClass}><option value="">Email type</option><option>DIRECT</option><option>DEPARTMENT</option><option>GENERAL</option><option>NOT_VERIFIED</option></select><input name="whatsapp" defaultValue={metadata?.whatsapp} placeholder="WhatsApp" className={fieldClass} /><input name="sourceUrl" defaultValue={metadata?.sourceUrl} placeholder="Evidence URL" className={fieldClass} /><button className="rounded bg-gray-900 px-3 py-2 text-xs font-medium text-white">Save metadata</button></form></details>
          </div>; }) : <p className="text-sm text-gray-500">No contacts yet.</p>}</div>
          <details className="mt-4"><summary className="cursor-pointer list-none text-sm font-medium text-forest-700">+ Add contact</summary><form method="post" action="/api/internal/sales" className="mt-3 grid gap-2"><input type="hidden" name="action" value="add_contact" /><input type="hidden" name="organizationId" value={organization.id} /><input required name="name" placeholder="Name" className={fieldClass} /><input name="title" placeholder="Title" className={fieldClass} /><input name="email" type="email" placeholder="Email" className={fieldClass} /><input name="phone" placeholder="Phone" className={fieldClass} /><button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white">Add contact</button></form></details>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Sales workflow</h2><form method="post" action="/api/internal/sales" className="mt-4 grid gap-3"><input type="hidden" name="action" value="update_status" /><input type="hidden" name="organizationId" value={organization.id} /><input type="hidden" name="experiment" value="VISUAL_COMMERCE" /><select name="status" defaultValue={organization.status} className={fieldClass}>{SALES_ORGANIZATION_STATUSES.map((value) => <option key={value}>{value}</option>)}</select><input name="assignedOwner" defaultValue={organization.assignedOwner} placeholder="Assigned owner" className={fieldClass} /><input name="nextAction" defaultValue={organization.nextAction} placeholder="Next action" className={fieldClass} /><input name="nextActionDate" type="datetime-local" defaultValue={organization.nextActionDate ? new Date(organization.nextActionDate).toISOString().slice(0, 16) : ""} className={fieldClass} /><textarea name="notes" defaultValue={organization.notes} placeholder="Organization notes" className={fieldClass} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="doNotContact" defaultChecked={organization.doNotContact} /> Do not contact</label><button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">Save workflow</button></form></section>
      </div>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Relationship history</h2><p className="mt-1 text-xs text-gray-500">Organization activity grouped by conversation.</p></div><span className="text-xs text-gray-500">{interactions.length} messages</span></div><div className="mt-4 space-y-4">{conversations.length ? conversations.map((conversation) => <div key={conversation.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4"><div className="font-medium">{conversation.contactName || "Conversation"}</div><div className="mt-1 text-xs text-gray-500">{conversation.subject || "No subject"}</div><div className="mt-3 space-y-3">{conversation.interactions.map((interaction) => <div key={interaction.id} className="rounded border border-gray-100 bg-white p-3"><div className="text-xs text-gray-500">{new Date(interaction.occurredAt).toLocaleString()} · {interaction.direction} · {interaction.channel}</div><div className="mt-1 text-sm font-medium">{interaction.subject || "Interaction"}</div><p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{interaction.summary}</p></div>)}</div></div>) : <p className="text-sm text-gray-500">No conversations yet.</p>}</div></section>

      <details className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><summary className="cursor-pointer list-none font-semibold">Log interaction <span className="ml-2 text-xs font-normal text-gray-500">manual</span></summary><form method="post" action="/api/internal/sales" className="mt-4 grid gap-3 md:grid-cols-2"><input type="hidden" name="action" value="add_interaction" /><input type="hidden" name="organizationId" value={organization.id} /><select name="contactId" className={fieldClass}><option value="">No contact</option>{detail.contacts.map((contact) => <option value={contact.id} key={contact.id}>{contact.name}</option>)}</select><input name="occurredAt" type="datetime-local" required className={fieldClass} /><select name="channel" className={fieldClass}><option>EMAIL</option><option>WHATSAPP</option><option>PHONE</option><option>MEETING</option><option>OTHER</option></select><select name="direction" className={fieldClass}><option>OUTBOUND</option><option>INBOUND</option><option>INTERNAL</option></select><input name="subject" placeholder="Subject" className={`${fieldClass} md:col-span-2`} /><textarea required name="summary" placeholder="Summary" className={`${fieldClass} md:col-span-2`} /><button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white md:col-span-2">Log interaction</button></form></details>
    </div></main>
  </>;
}
