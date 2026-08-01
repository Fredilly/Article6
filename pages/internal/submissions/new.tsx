import Head from "next/head";
import PddUploadForm from "../../../components/preview/PddUploadForm";

export default function NewInternalSubmissionPage() {
  return (
    <>
      <Head>
        <title>Internal PDD submission | Article6</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-700">Article6 internal tool</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Record an internal PDD submission</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Use this protected form for documents received outside the public website. The PDF uploads directly to the private R2 bucket.
          </p>
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-7">
            <PddUploadForm mode="internal" />
          </div>
        </div>
      </main>
    </>
  );
}
