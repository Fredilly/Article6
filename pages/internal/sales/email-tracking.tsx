import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useEffect, useMemo, useState } from "react";
import SalesHeader from "../../../components/SalesHeader";
import OrganizationFuzzyPicker from "../../../components/OrganizationFuzzyPicker";
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
const timeOnly = (value: string) => new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const dateKey = (value: string) => value.slice(0, 10);
const dateLabel = (key: string) => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" });

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function clientSignature(userAgent?: string): string | undefined {
  if (!userAgent) return undefined;
  const browser = /edg\//i.test(userAgent) ? "EDGE"
    : /firefox\//i.test(userAgent) ? "FIREFOX"
      : /chrome\//i.test(userAgent) ? "CHROME"
        : /safari\//i.test(userAgent) ? "SAFARI"
          : /mozilla/i.test(userAgent) ? "MOZILLA"
            : undefined;
  if (!browser) return undefined;
  const platform = /android/i.test(userAgent) ? "ANDROID"
    : /iphone|ipad|ios/i.test(userAgent) ? "IOS"
      : /windows/i.test(userAgent) ? "WINDOWS"
        : /macintosh|mac os/i.test(userAgent) ? "MAC"
          : /linux/i.test(userAgent) ? "LINUX"
            : "OTHER";
  return `${browser}:${platform}`;
}

function hasPossibleForward(record: EmailTrackingRecord): boolean {
  const clients = new Set(
    record.events
      .filter((event) => event.eventType === "CLICK" && event.classification === "HUMAN_LIKELY")
      .map((event) => clientSignature(event.userAgent))
      .filter((value): value is string => Boolean(value)),
  );
  return clients.size >= 2;
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
  const organizationOptions = useMemo(() => details.map((item) => ({ id: item.organization.id, name: item.organization.name })), [details]);
  const groupedRecords = useMemo(() => {
    const groups = new Map<string, EmailTrackingRecord[]>();
    records.forEach((record) => {
      const key = dateKey(record.createdAt);
      const current = groups.get(key) || [];
      current.push(record);
      groups.set(key, current);
    });
    return Array.from(groups.entries()).map(([key, items]) => ({ key, items }));
  }, [records]);

  useEffect(() => {
    let active = true;

    async function refreshTracking() {
      try {
        const response = await fetch("/api/internal/email-tracking", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (active && Array.isArray(data.records)) setRecords(data.records);
      } catch {
        // Keep the current screen intact if a background refresh fails.
      }
    }

    const interval = window.setInterval(refreshTracking, 10_000);
    const handleVisibility = () => { if (document.visibilityState === "visible") void refreshTracking(); };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

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
    const visibleLinkText = escapeHtml(linkText || destination);
    const trackedLink = generated.clickUrl ? `<a href="${generated.clickUrl}">${visibleLinkText}</a>` : "";

    let withLink = safeBody;
    if (trackedLink) {
      if (safeBody.includes("{{link}}")) {
        withLink = safeBody.replace(/\{\{link\}\}/g, trackedLink);
      } else if (visibleLinkText && safeBody.includes(visibleLinkText)) {
        const linkIndex = safeBody.lastIndexOf(visibleLinkText);
        withLink = `${safeBody.slice(0, linkIndex)}${trackedLink}${safeBody.slice(linkIndex + visibleLinkText.length)}`;
      } else {
        withLink = `${safeBody}<br><br>${trackedLink}`;
      }
    }

    const html = `${withLink}<img src="${generated.openUrl}" width="1" height="1" style="display:none;width:1px;height:1px" alt="">`;
    const plainLink = destination || linkText;
    let plain = body;
    if (body.includes("{{link}}")) {
      plain = body.replace(/\{\{link\}\}/g, plainLink);
    } else if (plainLink && !(linkText && body.includes(linkText))) {
      plain = `${body}\n\n${plainLink}`;
    }

    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([plain], { type: "text/plain" }) })]);
    } else {
      await navigator.clipboard.writeText(plain);
    }
    setMessage("Copied. Existing signature website is used as the tracked link; it is not duplicated.");
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

  async function clearTrackingHistory() {
    if (!window.confirm("Clear all email-tracking records and tracking events? CRM contacts, tenders and Gmail interactions will not be deleted.")) return;
    const response = await fetch("/api/internal/email-tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear", confirm: "CLEAR TRACKING HISTORY" }),
    });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Unable to clear tracking history."); return; }
    setRecords([]);
    setGenerated(null);
    setMessage(`Cleared ${data.result?.trackingDeleted || 0} tracking records and ${data.result?.eventsDeleted || 0} tracking events.`);
  }

  return <>
    <Head><title>Email tracking | Sales memory</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-6xl">
      <SalesHeader entries={searchEntries} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Generate tracked email</h2>
          <p className="mt-1 text-xs text-gray-500">If the body already contains the visible Article6 website, it becomes the tracked link in place. You can also use {"{{link}}"}. Open signals are probabilistic, not proof of a human read.</p>
          <div className="mt-4 grid gap-3">
            <OrganizationFuzzyPicker items={organizationOptions} value={organizationId} onChange={(id) => { setOrganizationId(id); setContactId(""); setTenderOpportunityId(""); }} />
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-semibold">Tracked outbound email</h2><p className="mt-1 text-xs text-gray-500">Grouped by sent date and compact by default. Auto-updates about every 10 seconds. Possible forward is an inference from distinct human-like click clients, not proof.</p></div>
            {records.length ? <button type="button" onClick={clearTrackingHistory} className="rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Clear tracking history</button> : null}
          </div>
          <div className="mt-4 space-y-3">{records.length ? groupedRecords.map((group, groupIndex) => (
            <details key={group.key} open={groupIndex === 0} className="rounded-md border border-gray-200 bg-gray-50/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-gray-700">
                <span>{dateLabel(group.key)}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-500 ring-1 ring-gray-200">{group.items.length}</span>
              </summary>
              <div className="space-y-2 border-t border-gray-200 p-2">{group.items.map((record) => {
                const possibleForward = hasPossibleForward(record);
                const recordOrganization = details.find((item) => item.organization.id === record.organizationId);
                const recordContact = recordOrganization?.contacts.find((contact) => contact.id === record.contactId);
                const clicked = Boolean(record.clickCount);
                const hasAction = Boolean(record.replied || record.openCount || record.clickCount || possibleForward);
                const leadHref = recordOrganization
                  ? `/internal/sales/organizations/${recordOrganization.organization.id}${recordContact ? `?contactId=${encodeURIComponent(recordContact.id)}` : ""}`
                  : undefined;
                return <details key={record.id} className={`rounded-md border text-sm transition-colors ${clicked ? "border-green-300 bg-green-50/70" : "border-gray-200 bg-white"}`}>
                  <summary className="cursor-pointer list-none px-3 py-2.5">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">{record.subject || "Outbound email"}</div>
                        <div className="mt-0.5 truncate text-[11px] text-gray-400">{recordOrganization ? recordOrganization.organization.name : "Unknown organization"}{recordContact ? ` · ${recordContact.name}` : ""} · {timeOnly(record.createdAt)}</div>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1 text-[10px] font-semibold">
                        {record.replied ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800">REPLIED</span> : null}
                        {clicked ? <span className="rounded-full bg-green-600 px-2 py-0.5 text-white">CLICKED · {record.clickCount}</span> : null}
                        {possibleForward ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-800">POSSIBLE FORWARD</span> : null}
                        {!clicked && record.openCount ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">OPENED · {record.openCount}</span> : null}
                        {!clicked && !record.openCount ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">SENT</span> : null}
                        {hasAction && leadHref ? <Link href={leadHref} onClick={(event) => event.stopPropagation()} className="rounded-full bg-gray-900 px-2 py-0.5 text-white hover:bg-gray-700">VIEW LEAD →</Link> : null}
                      </div>
                    </div>
                  </summary>
                  <div className={`border-t px-3 pb-3 pt-2 ${clicked ? "border-green-200" : "border-gray-100"}`}>
                    <div className="grid gap-1 text-xs text-gray-600"><div>SENT · {dt(record.createdAt)}</div><div>First open: {dt(record.firstOpenedAt)} · Last open: {dt(record.lastOpenedAt)}</div><div>First click: {dt(record.firstClickedAt)} · Last click: {dt(record.lastClickedAt)}</div></div>
                    {record.events.length ? <div className="mt-3 border-t border-gray-100 pt-3"><div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Timeline</div><div className="mt-2 space-y-1 text-xs"><div>{dt(record.createdAt)} · Sent / tracking created</div>{record.events.map((event) => <div key={event.id}>{dt(event.occurredAt)} · {event.eventType === "OPEN" ? "Open detected" : "Link clicked"} · {event.classification.replace(/_/g, " ")}</div>)}{possibleForward ? <div>Possible forward activity · multiple distinct human-like click clients detected</div> : null}{record.replied ? <div>Reply detected by Gmail sync</div> : null}</div></div> : null}
                  </div>
                </details>;
              })}</div>
            </details>
          )) : <p className="text-sm text-gray-500">No tracked emails yet.</p>}</div>
        </section>
      </div>
    </div></main>
  </>;
}
