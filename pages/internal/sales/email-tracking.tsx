import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useMemo, useState } from "react";
import SalesHeader from "../../../components/SalesHeader";
import { loadSalesHomepageData } from "../../../lib/sales-homepage-store";
import { buildSalesMemorySearchEntries } from "../../../lib/sales-search";
import { listEmailTracking, type EmailTrackingRecord } from "../../../lib/email-tracking";

interface Props {
  details: Awaited<ReturnType<typeof loadSalesHomepageData>>["details"];
  records: EmailTrackingRecord[];
  searchEntries: ReturnType<typeof buildSalesMemorySearchEntries>;
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const data = await loadSalesHomepageData();
  return { props: { details: data.details, records: await listEmailTracking(), searchEntries: buildSalesMemorySearchEntries(data.details) } };
};

const fieldClass = "rounded-md border border-gray-300 px-3 py-2 text-sm";
const dt = (value?: string) => value ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

export default function EmailTrackingPage({ details, records: initialRecords, searchEntries }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [organizationId, setOrganizationId] = useState(details[0]?.organization.id || "");
  const [contactId, setContactId] = useState("");
  const [tenderOpportunityId, setTenderOpportunityId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [destination, setDestination] = useState("https://bids.article6.org");
  const [linkText, setLinkText] = useState("bids.article6.org");
  const [generated, setGenerated] = useState<{ token: string; openUrl: string; clickUrl?: string } | null>(null);
  const [message, setMessage] = useState("");
  const [records, setRecords] = useState(initialRecords);
  const selected = useMemo(() => details.find((item) => item.organization.id === organizationId), [details, organizationId]);

  async function createTrackedEmail() {
    setMessage("");
    const response = await fetch("/api/internal/email-tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", organizationId, contactId: contactId || undefined, tenderOpportunityId: tenderOpportunityId || undefined, subject, approvedDestination: destination || undefined }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Unable to create tracking."); return; }
    setGenerated({ token: data.token, openUrl: data.openUrl, clickUrl: data.clickUrl });
    setRecords((current) => [data.record, ...current]);
    setMessage("Tracking created. Copy the rich email, paste into Gmail, then send normally.");
  }

  async function copyRichEmail() {
    if (!generated) return;
    const safeBody = escapeHtml(body).replace(/\n/g, "<br>");
    const trackedLink = generated.clickUrl ? `<a href="${generated.clickUrl}">${escapeHtml(linkText || destination)}</a>` : "";
    const withLink = safeBody.includes("{{link}}") ? safeBody.replace(/\{\{link\}\}/g, trackedLink) : [safeBody, trackedLink ? `<br><br>${trackedLink}` : ""].join("");
    const html = `${withLink}<img src="${generated.openUrl}" width="1" height="1" style="display:none;width:1px;height:1px" alt="">`;
    const plain = body.replace(/\{\{link\}\}/g, destination || linkText);
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([plain], { type: "text/plain" }) })]);
    } else {
      await navigator.clipboard.writeText(plain);
    }
    setMessage("Copied. Paste into Gmail's normal rich-text composer.");
  }

  async function attachGmail() {
    if (!generated) return;
    const gmailMessageId = window.prompt("Gmail message ID (optional)") || "";
    const gmailThreadId = window.prompt("Gmail thread ID (optional)") || "";
    if (!gmailMessageId && !gmailThreadId) return;
    const response = await fetch("/api/internal/email-tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "attach", token: generated.token, gmailMessageId, gmailThreadId }) });
    const data = await response.json();
    setMessage(response.ok ? "Gmail IDs attached idempotently." : data.error || "Unable to attach Gmail IDs.");
  }

  return <>
    <Head><title>Email tracking | Sales memory</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <SalesHeader entries={searchEntries} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Generate tracked email</h2>
          <p className="mt-1 text-xs text-gray-500">Use {"{{link}}"} where the tracked Article6 link should appear. Open signals are probabilistic, not proof of a human read.</p>
          <div className="mt-4 grid gap-3">
            <select className={fieldClass} value={organizationId} onChange={(e) => { setOrganizationId(e.target.value); setContactId(""); setTenderOpportunityId(""); }}><option value="">Organization</option>{details.map((item) => <option key={item.organization.id} value={item.organization.id}>{item.organization.name}</option>)}</select>
            <select className={fieldClass} value={contactId} onChange={(e) => setContactId(e.target.value)}><option value="">Contact (optional)</option>{selected?.contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}{contact.email ? ` · ${contact.email}` : ""}</option>)}</select>
            <select className={fieldClass} value={tenderOpportunityId} onChange={(e) => setTenderOpportunityId(e.target.value)}><option value="">Tender (optional)</option>{selected?.tenderOpportunities.map((tender) => <option key={tender.id} value={tender.id}>{tender.name}</option>)}</select>
            <input className={fieldClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            <textarea className={`${fieldClass} min-h-48`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Paste the final email body here" />
            <input className={fieldClass} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Tracked Article6 destination" />
            <input className={fieldClass} value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Visible link text" />
            {!generated ? <button type="button" onClick={createTrackedEmail} className="rounded bg-forest-700 px-4 py-2 text-sm font-medium text-white">Generate tracking</button> : <div className="flex flex-wrap gap-2"><button type="button" onClick={copyRichEmail} className="rounded bg-forest-700 px-4 py-2 text-sm font-medium text-white">Copy rich email</button><button type="button" onClick={attachGmail} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium">Attach Gmail IDs</button><button type="button" onClick={() => setGenerated(null)} className="rounded border border-gray-300 px-4 py-2 text-sm">New token</button></div>}
            {message ? <p className="text-xs text-gray-600">{message}</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Tracked outbound email</h2>
          <div className="mt-4 space-y-4">{records.length ? records.map((record) => <div key={record.id} className="rounded-md border border-gray-200 p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-medium">{record.subject || "Outbound email"}</div><div className="mt-1 text-xs text-gray-500">SENT · {dt(record.createdAt)}</div></div><div className="flex flex-wrap gap-2 text-[11px] font-semibold"><span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">SENT</span>{record.openCount ? <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">OPEN DETECTED · {record.openCount}</span> : null}{record.clickCount ? <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">CLICKED · {record.clickCount}</span> : null}{record.replied ? <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">REPLIED</span> : null}</div></div>
            <div className="mt-2 grid gap-1 text-xs text-gray-600"><div>First open: {dt(record.firstOpenedAt)} · Last open: {dt(record.lastOpenedAt)}</div><div>First click: {dt(record.firstClickedAt)} · Last click: {dt(record.lastClickedAt)}</div></div>
            {record.events.length ? <div className="mt-3 border-t border-gray-100 pt-3"><div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Timeline</div><div className="mt-2 space-y-1 text-xs"><div>{dt(record.createdAt)} · Sent / tracking created</div>{record.events.map((event) => <div key={event.id}>{dt(event.occurredAt)} · {event.eventType === "OPEN" ? "Open detected" : "Link clicked"} · {event.classification.replace(/_/g, " ")}</div>)}{record.replied ? <div>Reply detected by Gmail sync</div> : null}</div></div> : null}
          </div>) : <p className="text-sm text-gray-500">No tracked emails yet.</p>}</div>
        </section>
      </div>
    </div></main>
  </>;
}
