import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getSubmissionByReference, type SubmissionRecord } from "../../../lib/submission-store";
import { isSubmissionReference } from "../../../lib/submissions";

interface Props { submission: SubmissionRecord; }

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const reference = params?.reference;
  if (!isSubmissionReference(reference)) return { notFound: true };
  const submission = await getSubmissionByReference(reference);
  return submission ? { props: { submission } } : { notFound: true };
};

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt><dd className="mt-1 break-words text-sm text-gray-900">{value || "Not provided"}</dd></div>;
}

export default function SubmissionDetailPage({ submission }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <>
    <Head><title>{submission.reference} | Article6 Internal</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900"><div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-forest-700">Submission detail</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{submission.reference}</h1>
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-7"><dl className="grid gap-6 sm:grid-cols-2">
        <Detail label="Project" value={submission.project} /><Detail label="Organization" value={submission.organization} />
        <Detail label="Contact" value={`${submission.contactName}${submission.workEmail ? ` · ${submission.workEmail}` : ""}`} />
        <Detail label="External contact" value={submission.externalContact || ""} /><Detail label="Methodology" value={submission.methodology} />
        <Detail label="Source" value={submission.submissionSource} /><Detail label="Original filename" value={submission.originalFilename} />
        <Detail label="File size" value={`${(submission.fileSize / (1024 * 1024)).toFixed(2)} MiB`} />
        <Detail label="Submitted" value={new Date(submission.createdAt).toLocaleString()} /><Detail label="Status" value={submission.status} />
      </dl><div className="mt-6 border-t border-gray-100 pt-6"><Detail label="Notes" value={submission.notes} /></div>
      <div className="mt-8 flex flex-wrap gap-3 border-t border-gray-100 pt-6"><button type="button" disabled className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500">Download PDF</button><button type="button" disabled className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500">Run Quick Check</button></div>
      </div>
    </div></main>
  </>;
}
