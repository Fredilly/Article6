import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useState } from "react";
import type { QuickCheckResult } from "../../../lib/quick-check";
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

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

function CheckResult({ result }: { result: QuickCheckResult }) {
  if (result.version === 1) return <div className="mt-6 border-t border-gray-100 pt-6">
    <h2 className="text-base font-semibold text-gray-900">Quick Check results</h2>
    <dl className="mt-5 grid gap-6 sm:grid-cols-2">
      <Detail label="PDF validation" value={result.isPdf ? "Valid PDF signature" : "PDF signature not detected"} />
      <Detail label="Document metadata" value={`${(result.fileSize / (1024 * 1024)).toFixed(2)} MiB · ${result.checks.length} checks`} />
      <Detail label="Extracted text" value={result.extractedTextPreview ? "Available" : "Not available"} />
      <Detail label="Page count" value={result.pageCount === null ? "Not stored" : String(result.pageCount)} />
    </dl>
    <div className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Validation checks</h3>
      <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200 text-sm">{result.checks.map((check) => <li key={check.name} className="flex flex-wrap items-start justify-between gap-3 px-3 py-2"><span className="font-medium text-gray-900">{check.name}</span><span className={check.passed ? "text-green-700" : "text-red-700"}>{check.passed ? "Passed" : "Failed"}: {check.detail}</span></li>)}</ul>
    </div>
    <div className="mt-6"><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Extracted text preview</h3><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs leading-5 text-gray-700">{result.extractedTextPreview || "No extracted text preview was stored."}</pre></div>
  </div>;
  return <div className="mt-6 border-t border-gray-100 pt-6">
    <h2 className="text-base font-semibold text-gray-900">Quick Check results</h2>
    <dl className="mt-5 grid gap-6 sm:grid-cols-2">
      <Detail label="PDF validation" value="Signature and size validated" />
      <Detail label="Document metadata" value={`${result.parserEngine}${result.parserVersion ? ` · ${result.parserVersion}` : ""}`} />
      <Detail label="Extracted text" value={result.extractedTextPreview ? "Available" : "Not available"} />
      <Detail label="Page count" value={result.pageCount === null ? "Not stored" : String(result.pageCount)} />
    </dl>
    <div className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Validation checks</h3>
      <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200 text-sm">
        <li className="flex flex-wrap items-start justify-between gap-3 px-3 py-2">
          <span className="font-medium text-gray-900">extraction</span>
          <span className={result.extractionStatus === "completed" ? "text-green-700" : "text-red-700"}>{result.extractionStatus}</span>
        </li>
      </ul>
    </div>
    <div className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Extracted text preview</h3>
      <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs leading-5 text-gray-700">{result.extractedTextPreview || "No extracted text preview was stored."}</pre>
    </div>
  </div>;
}

export default function SubmissionDetailPage({ submission }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [quickCheckStatus, setQuickCheckStatus] = useState(submission.quickCheckStatus);
  const [quickCheckId, setQuickCheckId] = useState(submission.quickCheckId);
  const [quickCheckResult, setQuickCheckResult] = useState(submission.quickCheckResult as QuickCheckResult | undefined);
  const [quickCheckStartedAt, setQuickCheckStartedAt] = useState(submission.quickCheckStartedAt);
  const [quickCheckCompletedAt, setQuickCheckCompletedAt] = useState(submission.quickCheckCompletedAt);
  const [quickCheckFailedAt, setQuickCheckFailedAt] = useState(submission.quickCheckFailedAt);
  const [quickCheckError, setQuickCheckError] = useState(submission.quickCheckError);
  async function runCheck() {
    const startedAt = new Date().toISOString();
    setQuickCheckStatus("processing"); setQuickCheckStartedAt(startedAt); setQuickCheckCompletedAt(undefined); setQuickCheckFailedAt(undefined); setQuickCheckError(undefined); setQuickCheckResult(undefined);
    try {
      const response = await fetch(`/api/internal/submissions/${submission.reference}/quick-check`, { method: "POST" });
      const body = await response.json() as { status?: typeof quickCheckStatus; quickCheckId?: string; error?: string };
      if (!response.ok) { setQuickCheckStatus("failed"); setQuickCheckFailedAt(new Date().toISOString()); setQuickCheckError(body.error || "Unable to run Quick Check."); return; }
      setQuickCheckStatus(body.status || "completed"); setQuickCheckId(body.quickCheckId); setQuickCheckCompletedAt(new Date().toISOString());
      setQuickCheckResult((body as { result?: QuickCheckResult }).result);
    } catch {
      setQuickCheckStatus("failed"); setQuickCheckFailedAt(new Date().toISOString()); setQuickCheckError("Unable to reach the Quick Check service.");
    }
  }
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
        <Detail label="Submitted" value={formatDate(submission.createdAt)} /><Detail label="Status" value={submission.status} />
      </dl><div className="mt-6 border-t border-gray-100 pt-6"><Detail label="Notes" value={submission.notes} /></div>
      <section className="mt-8 border-t border-gray-100 pt-6" aria-labelledby="quick-check-heading">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="quick-check-heading" className="text-lg font-semibold text-gray-900">Quick Check</h2><p className="mt-1 text-sm text-gray-600">Stored intake validation and extraction audit.</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize text-gray-700">{quickCheckStatus}</span></div>
        <dl className="mt-5 grid gap-6 sm:grid-cols-2">
          <Detail label="Audit ID" value={quickCheckId || "Not recorded"} />
          <Detail label="Result storage" value={quickCheckResult ? "Stored in submission record" : "No result stored"} />
          <Detail label="Started" value={formatDate(quickCheckStartedAt)} />
          <Detail label="Completed" value={formatDate(quickCheckCompletedAt)} />
          {quickCheckStatus === "failed" && <Detail label="Failed" value={formatDate(quickCheckFailedAt)} />}
        </dl>
        {quickCheckStatus === "failed" && <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="font-semibold">Error details</p><p className="mt-1 break-words">{quickCheckError || "No error details were stored."}</p></div>}
        {quickCheckStatus === "completed" && quickCheckResult && <CheckResult result={quickCheckResult} />}
      </section>
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6"><a href={`/api/internal/submissions/${submission.reference}/download`} className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800">Download PDF</a><button type="button" onClick={runCheck} disabled={quickCheckStatus === "processing"} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-wait disabled:opacity-60">{quickCheckStatus === "processing" ? "Running Quick Check…" : "Run Quick Check"}</button></div>
      </div>
    </div></main>
  </>;
}
