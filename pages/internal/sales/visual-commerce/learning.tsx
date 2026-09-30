import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getScoopLearningReport, type ScoopLearningReport } from "../../../../lib/scoop-learning";

interface Props {
  report: ScoopLearningReport | null;
  error: string;
  reviewed: string;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  try {
    return {
      props: {
        report: await getScoopLearningReport(),
        error: typeof query.error === "string" ? query.error : "",
        reviewed: typeof query.reviewed === "string" ? query.reviewed : "",
      },
    };
  } catch (error) {
    return {
      props: {
        report: null,
        error: error instanceof Error ? error.message : "Could not load Scoop learning data.",
        reviewed: "",
      },
    };
  }
};

function n(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(value: number, total: number): string {
  if (!total) return "0%";
  return Math.round((value / total) * 100) + "%";
}

function money(value: unknown): string {
  return "$" + n(value).toFixed(3);
}

function ms(value: unknown): string {
  const amount = n(value);
  return amount >= 1000 ? (amount / 1000).toFixed(1) + "s" : Math.round(amount) + "ms";
}

function text(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function jsonList(value: unknown): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  } catch {
    return [];
  }
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
    <div className="mt-2 text-3xl font-bold tracking-tight text-gray-950">{value}</div>
    {note ? <div className="mt-1 text-xs text-gray-500">{note}</div> : null}
  </div>;
}

export default function ScoopLearningDashboard({ report, error, reviewed }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const learning = report?.learning ?? {};
  const totals = report?.totals ?? {};
  const scoops = n(learning.scoop_count);
  const results = n(learning.results_count);
  const noResults = n(learning.no_results_count);
  const feedback = n(totals.feedback_count);
  const wrong = n(totals.wrong_count);
  const correct = n(totals.correct_count);
  const queue = report?.learning_queue ?? [];

  return <>
    <Head>
      <title>Scoop Alpha Learning | Article6 Internal</title>
      <meta name="robots" content="noindex,nofollow" />
    </Head>
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/internal/sales" className="text-sm font-medium text-forest-700 hover:underline">← Sales memory</Link>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#1769FF]">Scoop Founding Alpha</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Alpha Learning</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">What testers are teaching Scoop: outcomes, failure patterns, corrections, cost and reusable product memory.</p>
          </div>
          <a href="/internal/sales/visual-commerce/learning" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Refresh data</a>
        </div>

        {reviewed ? <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Review saved: {reviewed.replaceAll("_", " ")}.</div> : null}
        {error ? <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div> : null}

        {report ? <>
          <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <Stat label="Scoops" value={scoops} />
            <Stat label="Results" value={results} note={percent(results, scoops)} />
            <Stat label="No result" value={noResults} note={percent(noResults, scoops)} />
            <Stat label="Feedback" value={feedback} />
            <Stat label="Useful / correct" value={correct} note={percent(correct, feedback)} />
            <Stat label="Wrong" value={wrong} note={percent(wrong, feedback)} />
            <Stat label="Avg latency" value={ms(learning.avg_latency_ms)} />
            <Stat label="Verification cost" value={money(learning.verification_cost_usd)} />
          </section>

          <div className="mt-7 grid gap-6 lg:grid-cols-3">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div><h2 className="font-semibold">Failure categories</h2><p className="mt-1 text-xs text-gray-500">Where Scoop most often fails to return results.</p></div>
              </div>
              <div className="mt-4 space-y-3">
                {(report.failure_categories.length ? report.failure_categories : []).slice(0, 10).map((item, index) =>
                  <div key={index} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 text-sm">
                    <div><div className="font-medium">{text(item.category)}</div><div className="text-xs text-gray-500">{text(item.subcategory)}</div></div>
                    <div className="font-bold">{n(item.failures)}</div>
                  </div>
                )}
                {!report.failure_categories.length ? <p className="text-sm text-gray-500">No failure data yet.</p> : null}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Provider / query corrections</h2>
              <p className="mt-1 text-xs text-gray-500">Patterns behind wrong results.</p>
              <div className="mt-4 space-y-3">
                {report.provider_query_patterns.slice(0, 10).map((item, index) =>
                  <div key={index} className="border-b border-gray-100 pb-3 text-sm">
                    <div className="flex justify-between gap-3"><span className="font-semibold">{text(item.provider)}</span><span>{n(item.corrections)}</span></div>
                    <div className="mt-1 break-words text-xs text-gray-500">{text(item.query_text)}</div>
                  </div>
                )}
                {!report.provider_query_patterns.length ? <p className="text-sm text-gray-500">No correction patterns yet.</p> : null}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Repeated bad candidates</h2>
              <p className="mt-1 text-xs text-gray-500">Candidates the feedback harness should suppress.</p>
              <div className="mt-4 space-y-3">
                {report.repeated_bad_candidates.slice(0, 10).map((item, index) =>
                  <div key={index} className="border-b border-gray-100 pb-3 text-sm">
                    <div className="font-mono text-xs text-gray-600">{text(item.candidate_key)}</div>
                    <div className="mt-1 text-xs text-gray-500">Wrong {n(item.wrong_count)} · Correct {n(item.correct_count)}</div>
                  </div>
                )}
                {!report.repeated_bad_candidates.length ? <p className="text-sm text-gray-500">No repeated bad candidates yet.</p> : null}
              </div>
            </section>
          </div>

          <section className="mt-7 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-semibold">Correction review queue</h2>
                <p className="mt-1 text-xs text-gray-500">Resolve bad Scoops into useful learning. Verified products become canonical Product Memory.</p>
              </div>
              <span className="rounded-full bg-[#1769FF]/10 px-3 py-1 text-xs font-bold text-[#1769FF]">{queue.length} unresolved</span>
            </div>

            <div className="divide-y divide-gray-100">
              {queue.map((item) => {
                const visibleText = jsonList(item.visible_text_json);
                const markings = jsonList(item.logos_markings_json);
                const features = jsonList(item.distinctive_features_json);
                return <article key={item.event_id + ":" + item.result_id} className="p-5">
                  <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">{item.feedback_type.replaceAll("_", " ")}</span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{text(item.result_class)}</span>
                        <span className="text-xs text-gray-400">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold">{[item.brand, item.model].filter(Boolean).join(" ") || text(item.subcategory, text(item.category, "Unknown product"))}</h3>
                      <div className="mt-1 text-sm text-gray-600">{text(item.category)} / {text(item.subcategory)} · {text(item.provider)} · {text(item.vision_model)}</div>
                      <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                        <div><b>Visible text:</b> {visibleText.join(" · ") || "—"}</div>
                        <div><b>Markings:</b> {markings.join(" · ") || "—"}</div>
                        <div className="sm:col-span-2"><b>Features:</b> {features.join(" · ") || "—"}</div>
                        <div><b>Latency:</b> {ms(item.latency_ms)}</div>
                        <div><b>Verification cost:</b> {money(item.verification_cost_usd)}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <form method="post" action="/api/internal/scoop-learning" className="flex flex-wrap gap-2">
                        <input type="hidden" name="event_id" value={item.event_id} />
                        <input type="hidden" name="result_id" value={item.result_id} />
                        <button name="action" value="hard_negative" className="rounded-md bg-gray-900 px-3 py-2 text-xs font-bold text-white">Mark hard negative</button>
                        <button name="action" value="dismiss" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700">Dismiss</button>
                      </form>

                      <details className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                        <summary className="cursor-pointer list-none text-sm font-bold text-[#1769FF]">Verify the correct product →</summary>
                        <form method="post" action="/api/internal/scoop-learning" className="mt-3 grid gap-2">
                          <input type="hidden" name="event_id" value={item.event_id} />
                          <input type="hidden" name="result_id" value={item.result_id} />
                          <input type="hidden" name="action" value="verify_product" />
                          <input name="brand" defaultValue={item.brand ?? ""} placeholder="Brand" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
                          <input name="title" placeholder="Correct product title" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
                          <input required name="product_id" placeholder="SKU / model" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
                          <input required name="destination" type="url" placeholder="Product URL" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
                          <input name="note" placeholder="Optional note" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
                          <button className="rounded-md bg-[#1769FF] px-3 py-2 text-sm font-bold text-white">Add to Product Memory</button>
                        </form>
                      </details>
                    </div>
                  </div>
                </article>;
              })}
              {!queue.length ? <div className="px-5 py-10 text-center text-sm text-gray-500">Nothing waiting for review.</div> : null}
            </div>
          </section>
        </> : null}
      </div>
    </main>
  </>;
}
