import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { listSalesImportCandidates, type SalesImportCandidate } from "../../../lib/sales-import-store";
import { listSalesOrganizations, type SalesOrganization } from "../../../lib/sales-store";

interface Props { candidates: SalesImportCandidate[]; organizations: SalesOrganization[]; }

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const [candidates, organizations] = await Promise.all([listSalesImportCandidates("PENDING"), listSalesOrganizations("")]);
  return { props: { candidates, organizations } };
};

function formatDate(value: string) { return new Date(value).toLocaleString(); }
function confidenceClass(value?: number) {
  if ((value ?? 0) >= 85) return "bg-green-50 text-green-700";
  if ((value ?? 0) >= 60) return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-700";
}

export default function SalesImportReviewPage({ candidates, organizations }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <>
    <Head><title>Sales Import Review | Article6 Internal</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-700">Article6 internal tool</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Import verification</h1>
          <p className="mt-2 text-sm text-gray-600">Machine-reconstructed sales history stays untrusted until you approve it.</p>
        </div>
        <Link href="/internal/sales" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">Back to sales memory</Link>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="text-sm"><span className="font-semibold">{candidates.length}</span> pending organization bundle{candidates.length === 1 ? "" : "s"}</div>
        <p className="mt-1 text-xs text-gray-500">Approve creates or merges the organization, contacts, projects and append-only interactions in one transaction. Ignore preserves the candidate as reviewed but does not alter sales memory.</p>
      </div>

      <div className="mt-6 space-y-5">
        {candidates.length === 0 ? <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">No import candidates waiting for review.</div> : candidates.map((candidate) => <article key={candidate.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{candidate.organizationName}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${confidenceClass(candidate.confidence)}`}>{candidate.confidence == null ? "Unscored" : `${candidate.confidence}% confidence`}</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{candidate.sourceType}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{candidate.domain || "No domain inferred"} · imported {formatDate(candidate.createdAt)}</p>
            </div>
            <div className="text-right text-xs text-gray-500">Source key<br/><span className="font-mono">{candidate.sourceKey}</span></div>
          </div>

          {candidate.evidenceSummary ? <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-700">{candidate.evidenceSummary}</div> : null}

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <section className="rounded-md border border-gray-200 p-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contacts · {candidate.contacts.length}</h3>
              <div className="mt-2 space-y-2 text-sm">{candidate.contacts.length ? candidate.contacts.map((contact, index) => <div key={`${contact.email || contact.name}-${index}`}><div className="font-medium">{contact.name}</div><div className="text-xs text-gray-500">{contact.title || "No title"}{contact.email ? ` · ${contact.email}` : ""}</div></div>) : <span className="text-gray-500">None inferred</span>}</div>
            </section>
            <section className="rounded-md border border-gray-200 p-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Projects · {candidate.projects.length}</h3>
              <div className="mt-2 space-y-2 text-sm">{candidate.projects.length ? candidate.projects.map((project, index) => <div key={`${project.vcsId || project.name}-${index}`}><div className="font-medium">{project.vcsId ? `VCS ${project.vcsId} · ` : ""}{project.name}</div><div className="text-xs text-gray-500">{[project.methodology, project.methodologyVersion, project.role].filter(Boolean).join(" · ") || "No extra metadata"}</div></div>) : <span className="text-gray-500">None inferred</span>}</div>
            </section>
            <section className="rounded-md border border-gray-200 p-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Proposed disposition</h3>
              <div className="mt-2 text-sm"><div className="font-medium">{candidate.proposedStatus || "No status change"}</div><div className="text-xs text-gray-500">{candidate.proposedObjection || "No objection inferred"}</div></div>
            </section>
          </div>

          <section className="mt-4 rounded-md border border-gray-200 p-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Interactions · {candidate.interactions.length}</h3>
            <div className="mt-2 divide-y divide-gray-100">{candidate.interactions.length ? candidate.interactions.map((interaction, index) => <div key={`${interaction.externalReference || interaction.occurredAt}-${index}`} className="py-2 text-sm">
              <div className="flex flex-wrap gap-x-3 gap-y-1"><span className="font-medium">{interaction.direction || "INTERNAL"} {interaction.channel || "EMAIL"}</span><span className="text-gray-500">{formatDate(interaction.occurredAt)}</span>{interaction.contactEmail ? <span className="text-gray-500">{interaction.contactEmail}</span> : null}</div>
              {interaction.subject ? <div className="mt-1 text-xs font-medium text-gray-600">{interaction.subject}</div> : null}<div className="mt-1 text-gray-700">{interaction.summary}</div>
            </div>) : <div className="py-2 text-sm text-gray-500">No interactions inferred.</div>}</div>
          </section>

          <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
            <form method="post" action="/api/internal/sales-import" className="flex flex-1 flex-wrap items-end gap-3">
              <input type="hidden" name="action" value="approve"/><input type="hidden" name="candidateId" value={candidate.id}/>
              <label className="min-w-[280px] flex-1 text-xs font-medium text-gray-600">Approve into organization
                <select name="organizationId" defaultValue={candidate.matchedOrganizationId || ""} className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900">
                  <option value="">Create new organization</option>
                  {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}{organization.domain ? ` · ${organization.domain}` : ""}</option>)}
                </select>
              </label>
              {candidate.matchedOrganizationName ? <div className="pb-2 text-xs font-medium text-forest-700">Auto-match: {candidate.matchedOrganizationName}</div> : null}
              <button className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800">Approve bundle</button>
            </form>
            <form method="post" action="/api/internal/sales-import"><input type="hidden" name="action" value="ignore"/><input type="hidden" name="candidateId" value={candidate.id}/><button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">Ignore</button></form>
          </div>
        </article>)}
      </div>
    </div></main>
  </>;
}
