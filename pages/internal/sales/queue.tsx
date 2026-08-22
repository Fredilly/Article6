import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { listSalesActionQueue, type SalesActionQueueItem, type SalesActionQueueKind } from "../../../lib/sales-store";

type QueueFilter = "ALL" | "OVERDUE" | "NO_OUTREACH" | "NEEDS_ACTION";
interface Props { items: SalesActionQueueItem[]; kind: SalesActionQueueKind; filter: QueueFilter; }

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const kind = query.kind === "TENDER" ? "TENDER" : "CARBON";
  const filter = ["ALL", "OVERDUE", "NO_OUTREACH", "NEEDS_ACTION"].includes(String(query.filter)) ? String(query.filter) as QueueFilter : "ALL";
  const now = Date.now();
  const items = (await listSalesActionQueue(kind)).filter((item) => {
    const overdue = Boolean(item.nextActionDate && new Date(item.nextActionDate).getTime() < now);
    const noOutreach = item.status === "NEW" && !item.hasOutreach;
    const needsAction = item.status === "ENGAGED" && !item.nextAction;
    if (filter === "OVERDUE") return overdue;
    if (filter === "NO_OUTREACH") return noOutreach;
    if (filter === "NEEDS_ACTION") return needsAction;
    return true;
  });
  return { props: { items, kind, filter } };
};

function href(kind: SalesActionQueueKind, filter: QueueFilter) {
  return `/internal/sales/queue?kind=${kind}&filter=${filter}`;
}

function isOverdue(item: SalesActionQueueItem) {
  return Boolean(item.nextActionDate && new Date(item.nextActionDate).getTime() < Date.now());
}

function itemReason(item: SalesActionQueueItem) {
  if (isOverdue(item)) return "Overdue follow-up";
  if (item.status === "NEW" && !item.hasOutreach) return "New · no outreach";
  if (item.status === "ENGAGED" && !item.nextAction) return "Engaged · set next action";
  return item.nextAction ? "Scheduled follow-up" : "No next action set";
}

export default function SalesQueuePage({ items, kind, filter }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const label = kind === "CARBON" ? "Carbon" : "Tender";
  return <><Head><title>{label} Action Queue | Article6 Internal</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><Link href="/internal/sales" className="text-sm font-medium text-forest-700">← Sales memory</Link><h1 className="mt-4 text-3xl font-bold tracking-tight">Daily action queue</h1><p className="mt-2 text-sm text-gray-600">Work the next follow-up. Overdue and missing-action records stay visible without dashboard metrics.</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">{items.length} records</span></div>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Opportunity type"><Link href={href("CARBON", filter)} className={`rounded-md px-3 py-2 text-sm font-semibold ${kind === "CARBON" ? "bg-gray-900 text-white" : "border border-gray-300 bg-white text-gray-700"}`}>Carbon</Link><Link href={href("TENDER", filter)} className={`rounded-md px-3 py-2 text-sm font-semibold ${kind === "TENDER" ? "bg-amber-700 text-white" : "border border-gray-300 bg-white text-gray-700"}`}>Tender</Link></nav>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Queue filters">{(["ALL", "OVERDUE", "NO_OUTREACH", "NEEDS_ACTION"] as QueueFilter[]).map((value) => <Link key={value} href={href(kind, value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === value ? "bg-blue-100 text-blue-800 ring-2 ring-blue-300" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}>{value === "NO_OUTREACH" ? "NEW · NO OUTREACH" : value === "NEEDS_ACTION" ? "ENGAGED · NO ACTION" : value}</Link>)}</nav>
      <section className="mt-5 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3 font-medium">Opportunity</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Next action</th><th className="px-5 py-3 font-medium">Due</th><th className="px-5 py-3 font-medium">Queue reason</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-gray-100">{items.length ? items.map((item) => <tr key={`${item.kind}-${item.id}`} className={isOverdue(item) ? "bg-red-50/60" : ""}><td className="px-5 py-4 align-top"><div className="font-semibold text-gray-900">{item.title}</div><div className="mt-1 text-xs text-gray-500">{item.organizationName}{item.assignedOwner ? ` · ${item.assignedOwner}` : ""}</div></td><td className="whitespace-nowrap px-5 py-4 align-top font-medium text-gray-700">{item.status}</td><td className="max-w-xs px-5 py-4 align-top text-gray-700">{item.nextAction || "Set next action"}</td><td className={`whitespace-nowrap px-5 py-4 align-top ${isOverdue(item) ? "font-semibold text-red-700" : "text-gray-600"}`}>{item.nextActionDate ? new Date(item.nextActionDate).toLocaleString() : "Not scheduled"}</td><td className="whitespace-nowrap px-5 py-4 align-top text-xs font-semibold text-gray-600">{itemReason(item)}</td><td className="whitespace-nowrap px-5 py-4 text-right"><Link href={item.kind === "TENDER" ? `/internal/sales/tenders/${item.id}` : `/internal/sales/organizations/${item.organizationId}`} className="font-medium text-forest-700 hover:underline">Open →</Link></td></tr>) : <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">No records match this queue view.</td></tr>}</tbody></table></section>
    </div></main></>;
}
