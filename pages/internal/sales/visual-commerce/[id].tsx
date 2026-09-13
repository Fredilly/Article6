import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import SalesAutoRefresh from "../../../../../components/SalesAutoRefresh";
import { getSalesOrganizationDetail, type SalesOrganizationDetail } from "../../../../../lib/sales-store";
import { getSalesVisualCommerceContacts, getSalesVisualCommerceProfile, type SalesVisualCommerceContact, type SalesVisualCommerceProfile } from "../../../../../lib/sales-visual-commerce";

interface Props { detail: SalesOrganizationDetail; profile: SalesVisualCommerceProfile | null; contacts: SalesVisualCommerceContact[]; }

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const id = typeof params?.id === "string" ? params.id : "";
  const detail = await getSalesOrganizationDetail(id);
  if (!detail || detail.organization.experiment !== "VISUAL_COMMERCE") return { notFound: true };
  const [profile, contacts] = await Promise.all([getSalesVisualCommerceProfile(id), getSalesVisualCommerceContacts(id)]);
  return { props: { detail, profile, contacts } };
};

function show(value?: string) { return value?.trim() || "Not recorded"; }
function label(value?: string) { return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Not recorded"; }
function when(value?: string) { return value ? new Date(value).toLocaleString() : "Not recorded"; }
function LinkValue({ value }: { value?: string }) {
  if (!value) return <span className="text-gray-500">Not recorded</span>;
  const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return <a href={href} target="_blank" rel="noreferrer" className="text-forest-700 hover:underline">{value}</a>;
}
function Field({ name, children }: { name: string; children: React.ReactNode }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{name}</dt><dd className="mt-1 font-medium text-gray-900">{children}</dd></div>;
}

export default function VisualCommerceOrganizationPage({ detail, profile, contacts }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { organization, interactions } = detail;
  const lastInteraction = interactions.length ? interactions[interactions.length - 1]?.occurredAt : undefined;
  return <>
    <Head><title>{organization.name} | Visual Commerce CRM</title><meta name="robots" content="noindex,nofollow" /></Head>
    <SalesAutoRefresh />
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <Link href="/internal/sales" className="text-sm font-medium text-forest-700">← Sales memory</Link>
      <div className="mt-4 flex items-start justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1><p className="mt-1 text-sm text-gray-600">{organization.domain || "No domain"}{organization.country ? ` · ${organization.country}` : ""}</p><span className="mt-2 inline-block rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-semibold text-fuchsia-700">Visual Commerce</span></div><div className="text-sm font-semibold">{organization.status}</div></div>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Overview</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Field name="Company">{organization.name}</Field><Field name="Website"><LinkValue value={profile?.websiteUrl || organization.domain} /></Field><Field name="Country">{show(organization.country)}</Field><Field name="Category">{show(profile?.primaryCategory)}</Field><Field name="Customer type">{label(profile?.customerType)}</Field><Field name="Priority">{show(profile?.priority)}</Field><Field name="Status">{organization.status}</Field><Field name="Last interaction">{when(lastInteraction)}</Field>
      </dl></section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold">Visual Commerce Opportunity</h2><span className="text-xs text-gray-500">Last researched: {when(profile?.lastResearchedAt)}</span></div><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Field name="YouTube"><LinkValue value={profile?.youtubeUrl} /></Field><Field name="Instagram"><LinkValue value={profile?.instagramUrl} /></Field><Field name="TikTok"><LinkValue value={profile?.tiktokUrl} /></Field><Field name="Video presence">{label(profile?.videoPresence)}</Field><Field name="Existing video commerce">{label(profile?.existingVideoCommerce)}</Field><Field name="Existing affiliate activity">{label(profile?.existingAffiliateActivity)}</Field><Field name="Visual product fit">{label(profile?.visualProductFit)}</Field><Field name="Target customer gender">{show(profile?.targetCustomerGender)}</Field><Field name="Source"><LinkValue value={profile?.sourceUrl} /></Field>
        <div className="sm:col-span-2 lg:col-span-3"><Field name="VCL use case">{show(profile?.vclUseCase)}</Field></div><div className="sm:col-span-2 lg:col-span-3"><Field name="Value hypothesis">{show(profile?.valueHypothesis)}</Field></div><div className="sm:col-span-2 lg:col-span-3"><Field name="Monetization hypothesis">{show(profile?.monetizationHypothesis)}</Field></div><div className="sm:col-span-2 lg:col-span-3"><Field name="Qualification notes">{show(profile?.qualificationNotes)}</Field></div>
      </dl></section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Contacts <span className="text-xs font-normal text-gray-500">({contacts.length})</span></h2><div className="mt-3 space-y-3">{contacts.length ? contacts.map((contact) => <div key={contact.id} className="rounded-md border border-gray-100 p-3 text-sm"><div className="font-medium">{contact.name}</div><div className="text-gray-600">{contact.title || "No role recorded"}</div><div className="mt-2 grid gap-1 text-xs text-gray-600 sm:grid-cols-2"><div>Email: {contact.email || "Not verified"}</div><div>Email type: {contact.emailType || "Not recorded"}</div><div>Phone: {contact.phone || "Not recorded"}</div><div>WhatsApp: {contact.whatsapp || "Not recorded"}</div><div>Contact status: {contact.status}</div><div>Source: {contact.sourceUrl ? <a href={contact.sourceUrl} target="_blank" rel="noreferrer" className="text-forest-700 hover:underline">Evidence</a> : "Not recorded"}</div></div>{contact.notes ? <p className="mt-2 text-xs text-gray-500">{contact.notes}</p> : null}</div>) : <p className="text-sm text-gray-500">No contacts recorded.</p>}</div></section>
    </div></main>
  </>;
}
