import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { relationshipHistoryPresentation } from "../lib/sales-interaction-display";

const REFRESH_INTERVAL_MS = 15000;
const ATTRIBUTED_HISTORY_ID = "attributed-contact-history";
const ATTRIBUTION_RENDERING_ATTR = "data-attribution-rendering";

type AttributedHistoryItem = {
  id: string;
  occurredAt: string;
  subject?: string | null;
  summary: string;
  externalReference?: string | null;
  direction: string;
  channel: string;
  interactionType: string;
  outcomeCode?: string | null;
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

function textElement(tag: "div" | "p" | "span", text: string, className?: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function historyCountNode(section: HTMLElement): HTMLElement | null {
  return Array.from(section.querySelectorAll<HTMLElement>("div")).find((element) => /^\d+ messages? · \d+ conversations?$/.test(element.textContent?.trim() || "")) || null;
}

function nativeCounts(countNode: HTMLElement | null): { messages: number; conversations: number } {
  if (!countNode) return { messages: 0, conversations: 0 };
  const match = countNode.textContent?.trim().match(/^(\d+) messages? · (\d+) conversations?$/);
  return { messages: match ? Number(match[1]) : 0, conversations: match ? Number(match[2]) : 0 };
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
      const presentation = relationshipHistoryPresentation(item.direction, item.intendedContactName || undefined);

      const conversation = document.createElement("section");
      conversation.className = "rounded-lg border border-gray-100 bg-gray-50/50 p-4";
      conversation.dataset.interactionId = item.id;

      const conversationHeader = document.createElement("div");
      conversationHeader.className = "flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3";
      const headingBlock = document.createElement("div");
      headingBlock.appendChild(textElement("div", item.intendedContactName || "Conversation", "text-sm font-semibold text-gray-900"));
      headingBlock.appendChild(textElement("div", `${item.subject || "No subject"} · 1 message`, "mt-1 text-xs text-gray-500"));
      conversationHeader.appendChild(headingBlock);
      conversation.appendChild(conversationHeader);

      const messages = document.createElement("div");
      messages.className = "mt-4 space-y-5";

      const article = document.createElement("article");
      article.className = `flex flex-col ${presentation.alignment === "right" ? "items-end" : "items-start"}`;

      const bubble = document.createElement("div");
      bubble.className = `w-full max-w-3xl rounded-lg border px-4 py-3 ${presentation.alignment === "right" ? "border-blue-100 bg-blue-50" : "border-gray-200 bg-gray-50"}`;

      bubble.appendChild(textElement("div", new Date(item.occurredAt).toLocaleString(), "text-xs text-gray-500"));
      const addressLabel = item.direction === "INBOUND" ? "From" : "To";
      const address = item.actualContactEmail || item.intendedContactEmail || item.actualContactName || item.intendedContactName || "Email address not recorded";
      bubble.appendChild(textElement("div", `${addressLabel}: ${address}`, "mt-0.5 text-xs text-gray-500"));
      bubble.appendChild(textElement("div", item.subject || "Interaction", "mt-2 text-sm font-medium text-gray-900"));
      bubble.appendChild(textElement("p", item.summary.trim(), "mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700"));
      if (item.outcomeCode) {
        bubble.appendChild(textElement("div", item.outcomeCode, "mt-2 text-xs text-gray-400"));
      }

      article.appendChild(bubble);
      article.appendChild(textElement("div", presentation.actorName, "mt-1 px-1 text-xs font-medium text-gray-500"));
      messages.appendChild(article);
      conversation.appendChild(messages);
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
    const isRelationshipView = typeof router.query.contactId === "string" || typeof router.query.threadId === "string";

    const showAttributedHistory = async () => {
      if (cancelled) return;
      try {
        await renderAttributedContactHistory(router);
      } catch {
        // Attribution must never break the CRM page.
      }
    };

    const refresh = async () => {
      if (cancelled || isRelationshipView || refreshing.current || document.visibilityState !== "visible" || hasFocusedEditor()) return;
      refreshing.current = true;
      try {
        await router.replace(router.asPath, undefined, { scroll: false });
      } finally {
        refreshing.current = false;
      }
    };

    void showAttributedHistory();

    // Contact/thread history is intentionally stable: no timer/focus router refreshes.
    // Other CRM pages keep the existing lightweight auto-refresh behavior.
    const interval = isRelationshipView ? undefined : window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const onFocus = () => { if (!isRelationshipView) void refresh(); };
    const onVisibilityChange = () => {
      if (!isRelationshipView && document.visibilityState === "visible") void refresh();
    };

    if (!isRelationshipView) {
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.getElementById(ATTRIBUTED_HISTORY_ID)?.remove();
    };
  }, [router.asPath]);

  return null;
}
