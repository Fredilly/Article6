import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

const REFRESH_INTERVAL_MS = 15000;
const ATTRIBUTED_HISTORY_ID = "attributed-contact-history";
const ATTRIBUTION_RENDERING_ATTR = "data-attribution-rendering";

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

function historyCountNode(section: HTMLElement): HTMLElement | null {
  return Array.from(section.querySelectorAll<HTMLElement>("div")).find((element) => /^\d+ messages? · \d+ conversations?$/.test(element.textContent?.trim() || "")) || null;
}

function nativeCounts(countNode: HTMLElement | null): { messages: number; conversations: number } {
  if (!countNode) return { messages: 0, conversations: 0 };

  const storedMessages = countNode.dataset.nativeMessages;
  const storedConversations = countNode.dataset.nativeConversations;
  if (storedMessages != null && storedConversations != null) {
    return { messages: Number(storedMessages) || 0, conversations: Number(storedConversations) || 0 };
  }

  const match = countNode.textContent?.trim().match(/^(\d+) messages? · (\d+) conversations?$/);
  const messages = match ? Number(match[1]) : 0;
  const conversations = match ? Number(match[2]) : 0;
  countNode.dataset.nativeMessages = String(messages);
  countNode.dataset.nativeConversations = String(conversations);
  return { messages, conversations };
}

function setHistoryCount(countNode: HTMLElement | null, messages: number, conversations: number): void {
  if (!countNode) return;
  countNode.textContent = `${messages} message${messages === 1 ? "" : "s"} · ${conversations} conversation${conversations === 1 ? "" : "s"}`;
}

async function renderAttributedContactHistory(router: ReturnType<typeof useRouter>): Promise<void> {
  const organizationId = typeof router.query.id === "string" ? router.query.id : "";
  const contactId = typeof router.query.contactId === "string" ? router.query.contactId : "";
  if (!organizationId || !contactId) return;

  const section = relationshipHistorySection();
  if (!section) return;
  if (section.getAttribute(ATTRIBUTION_RENDERING_ATTR) === "1") return;
  section.setAttribute(ATTRIBUTION_RENDERING_ATTR, "1");

  try {
    const countNode = historyCountNode(section);
    const base = nativeCounts(countNode);
    document.getElementById(ATTRIBUTED_HISTORY_ID)?.remove();
    setHistoryCount(countNode, base.messages, base.conversations);

    const response = await fetch(`/api/internal/contact-history-attribution?organizationId=${encodeURIComponent(organizationId)}&contactId=${encodeURIComponent(contactId)}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;

    const payload = await response.json() as { items?: AttributedHistoryItem[] };
    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    const seen = new Set<string>();
    const items = rawItems.filter((item) => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    if (!items.length) return;

    const wrapper = document.createElement("div");
    wrapper.id = ATTRIBUTED_HISTORY_ID;
    wrapper.className = "mt-5 space-y-6";

    for (const item of items) {
      const conversation = document.createElement("section");
      conversation.className = "rounded-lg border border-gray-100 bg-gray-50/50 p-4";
      conversation.dataset.interactionId = item.id;

      const header = document.createElement("div");
      header.className = "flex flex-wrap items-start justify-between gap-3";
      const titleBlock = document.createElement("div");
      titleBlock.appendChild(textDiv(item.subject || "Email", "font-semibold text-gray-900"));
      titleBlock.appendChild(textDiv("EMAIL · OUTBOUND", "mt-1 text-xs font-medium uppercase tracking-wide text-gray-500"));
      header.appendChild(titleBlock);
      header.appendChild(textDiv(new Date(item.occurredAt).toLocaleString(), "text-xs text-gray-500"));
      conversation.appendChild(header);

      const route = document.createElement("div");
      route.className = "mt-3 rounded-md border border-gray-200 bg-white p-3";
      const intended = item.intendedContactName || "Named contact";
      const actualRoute = item.actualContactEmail
        ? `${item.actualContactName || "General inbox"} <${item.actualContactEmail}>`
        : item.actualContactName || "general company route";
      route.appendChild(textDiv(`To: ${intended} · sent via ${actualRoute}`, "text-xs font-medium text-gray-600"));
      route.appendChild(textDiv(item.summary, "mt-2 whitespace-pre-wrap text-sm text-gray-700"));
      if (item.externalReference) route.appendChild(textDiv(item.externalReference, "mt-2 text-xs text-gray-400"));
      conversation.appendChild(route);
      wrapper.appendChild(conversation);
    }

    const historyBody = Array.from(section.querySelectorAll<HTMLElement>("div")).find((element) => element.classList.contains("space-y-6"));
    (historyBody || section).appendChild(wrapper);

    const emptyMessage = Array.from(section.querySelectorAll<HTMLParagraphElement>("p")).find((element) => element.textContent?.trim() === "No conversations yet.");
    if (emptyMessage) emptyMessage.style.display = "none";

    setHistoryCount(countNode, base.messages + items.length, base.conversations + items.length);
  } finally {
    section.removeAttribute(ATTRIBUTION_RENDERING_ATTR);
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
