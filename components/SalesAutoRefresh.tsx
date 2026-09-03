import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

const REFRESH_INTERVAL_MS = 15000;
const ATTRIBUTED_HISTORY_ID = "attributed-contact-history";

type AttributedHistoryItem = {
  id: string;
  occurredAt: string;
  subject?: string | null;
  summary: string;
  externalReference?: string | null;
  actualContactName?: string | null;
  actualContactEmail?: string | null;
  intendedContactName?: string | null;
  intendedContactEmail?: string | null;
};

function hasFocusedEditor(): boolean {
  const active = document.activeElement;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
}

function relationshipHistorySection(): HTMLElement | null {
  const sections = Array.from(document.querySelectorAll<HTMLElement>("section"));
  return sections.find((section) => section.querySelector("h2")?.textContent?.trim() === "Relationship history") || null;
}

function textDiv(text: string, className?: string): HTMLDivElement {
  const element = document.createElement("div");
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

async function renderAttributedContactHistory(router: ReturnType<typeof useRouter>): Promise<void> {
  const organizationId = typeof router.query.id === "string" ? router.query.id : "";
  const contactId = typeof router.query.contactId === "string" ? router.query.contactId : "";
  document.getElementById(ATTRIBUTED_HISTORY_ID)?.remove();
  if (!organizationId || !contactId) return;

  const response = await fetch(`/api/internal/contact-history-attribution?organizationId=${encodeURIComponent(organizationId)}&contactId=${encodeURIComponent(contactId)}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return;
  const payload = await response.json() as { items?: AttributedHistoryItem[] };
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) return;

  const section = relationshipHistorySection();
  if (!section) return;

  const wrapper = document.createElement("div");
  wrapper.id = ATTRIBUTED_HISTORY_ID;
  wrapper.className = "mt-5 space-y-3";
  wrapper.appendChild(textDiv("Routed outreach", "text-xs font-semibold uppercase tracking-wide text-gray-500"));

  for (const item of items) {
    const card = document.createElement("div");
    card.className = "rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm";

    const heading = document.createElement("div");
    heading.className = "flex flex-wrap items-start justify-between gap-2";
    heading.appendChild(textDiv(item.subject || "Email", "font-semibold text-gray-900"));
    heading.appendChild(textDiv(new Date(item.occurredAt).toLocaleString(), "text-xs text-gray-500"));
    card.appendChild(heading);

    const intended = item.intendedContactName || "Named contact";
    const actualRoute = item.actualContactEmail
      ? `${item.actualContactName || "General inbox"} <${item.actualContactEmail}>`
      : item.actualContactName || "general company route";
    card.appendChild(textDiv(`Intended for ${intended} · actually sent via ${actualRoute}`, "mt-2 font-medium text-amber-900"));
    card.appendChild(textDiv(item.summary, "mt-2 whitespace-pre-wrap text-gray-700"));
    if (item.externalReference) card.appendChild(textDiv(item.externalReference, "mt-2 text-xs text-gray-500"));
    wrapper.appendChild(card);
  }

  const historyBody = Array.from(section.querySelectorAll<HTMLElement>("div")).find((element) => element.classList.contains("space-y-6"));
  (historyBody || section).appendChild(wrapper);

  const emptyMessage = Array.from(section.querySelectorAll<HTMLParagraphElement>("p")).find((element) => element.textContent?.trim() === "No conversations yet.");
  if (emptyMessage) emptyMessage.style.display = "none";

  const countNode = Array.from(section.querySelectorAll<HTMLElement>("div")).find((element) => /^\d+ messages? · \d+ conversations?$/.test(element.textContent?.trim() || ""));
  if (countNode) {
    const current = countNode.textContent?.trim().match(/^(\d+) messages? · (\d+) conversations?$/);
    const nativeMessages = current ? Number(current[1]) : 0;
    const nativeConversations = current ? Number(current[2]) : 0;
    const messages = nativeMessages + items.length;
    const conversations = nativeConversations + items.length;
    countNode.textContent = `${messages} message${messages === 1 ? "" : "s"} · ${conversations} conversation${conversations === 1 ? "" : "s"}`;
  }
}

export default function SalesAutoRefresh() {
  const router = useRouter();
  const refreshing = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const showAttributedHistory = async () => {
      if (cancelled) return;
      try {
        await renderAttributedContactHistory(router);
      } catch {
        // Relationship attribution is supplemental; never break the CRM page if it cannot load.
      }
    };

    const refresh = async () => {
      if (cancelled || refreshing.current || document.visibilityState !== "visible" || hasFocusedEditor()) return;
      refreshing.current = true;
      try {
        await router.replace(router.asPath, undefined, { scroll: false });
        await showAttributedHistory();
      } finally {
        refreshing.current = false;
      }
    };

    void showAttributedHistory();
    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const onFocus = () => void refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
}
