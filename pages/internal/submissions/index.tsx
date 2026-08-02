import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getSubmissions, type SubmissionRecord } from "../../../lib/submission-store";

interface Props { submissions: SubmissionRecord[]; }

export const getServerSideProps: GetServerSideProps<Props> = async () => ({
  props: { submissions: await getSubmissions() },
});

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function SubmissionIndexPage({ submissions }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <>
    <Head><title>Submissions | Article6 Internal</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900"><div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-forest-700">Article6 internal tool</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Submissions</h1><p className="mt-2 text-sm text-gray-600">Internal review queue</p></div>
        <Link href="/internal/submissions/new" className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800">New submission</Link>
      </div>
      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {submissions.length === 0 ? <p className="p-6 text-sm text-gray-600">No submissions yet.</p> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500"><tr>
            <th className="px-5 py-3">Reference</th><th className="px-5 py-3">Project</th><th className="px-5 py-3">Organization</th><th className="px-5 py-3">Methodology</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Submitted date</th><th className="px-5 py-3">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">{submissions.map((submission) => <tr key={submission.reference} className="text-gray-700">
            <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">{submission.reference}</td><td className="px-5 py-4">{submission.project}</td><td className="px-5 py-4">{submission.organization}</td><td className="px-5 py-4">{submission.methodology}</td><td className="whitespace-nowrap px-5 py-4">{submission.status}</td><td className="whitespace-nowrap px-5 py-4">{formatDate(submission.createdAt)}</td><td className="whitespace-nowrap px-5 py-4"><Link className="font-medium text-forest-700 hover:text-forest-800" href={`/internal/submissions/${submission.reference}`}>View</Link></td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </div></main>
  </>;
}
