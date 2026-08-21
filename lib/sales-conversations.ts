import type { SalesInteraction } from "./sales-store";

// Gmail threads can remain active for weeks. This only applies when a legacy
// row has no Gmail thread id; known Gmail thread ids remain authoritative.
const FALLBACK_THREAD_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export interface SalesConversation {
  id: string;
  contactId?: string;
  contactName?: string;
  gmailThreadId?: string;
  subject?: string;
  interactions: SalesInteraction[];
}

function normalizedSubject(subject?: string): string {
  return (subject || "")
    .trim()
    .replace(/^(?:(?:re|fw|fwd):\s*)+/i, "")
    .replace(/[\u2010-\u2015-]+/g, " ")
    .replace(/[^\w]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function contactKey(interaction: SalesInteraction): string {
  return interaction.contactId || `name:${(interaction.contactName || "").trim().toLowerCase()}`;
}

function sortInteractions(interactions: SalesInteraction[]): SalesInteraction[] {
  return interactions
    .map((interaction, index) => ({ interaction, index }))
    .sort((a, b) => {
      const timestamp = Date.parse(a.interaction.occurredAt) - Date.parse(b.interaction.occurredAt);
      return timestamp || a.index - b.index;
    })
    .map(({ interaction }) => interaction);
}

function addInteraction(conversation: SalesConversation, interaction: SalesInteraction): void {
  conversation.contactId ||= interaction.contactId;
  conversation.contactName ||= interaction.contactName;
  conversation.subject ||= interaction.subject;
  conversation.interactions.push(interaction);
}

function nearbyFallbackCandidates(
  fallbackGroups: Map<string, SalesConversation[]>,
  subject: string,
  timestamp: number,
): SalesConversation[] {
  return Array.from(fallbackGroups.values()).reduce<SalesConversation[]>((all, candidates) => all.concat(candidates), []).filter((candidate) => {
    if (normalizedSubject(candidate.subject) !== subject) return false;
    const last = candidate.interactions[candidate.interactions.length - 1];
    return Boolean(last) && Math.abs(timestamp - Date.parse(last.occurredAt)) <= FALLBACK_THREAD_WINDOW_MS;
  });
}

export function groupSalesInteractions(interactions: SalesInteraction[]): SalesConversation[] {
  const groups: SalesConversation[] = [];
  const byGmailThread = new Map<string, SalesConversation>();
  const fallbackGroups = new Map<string, SalesConversation[]>();

  for (const interaction of sortInteractions(interactions)) {
    let conversation: SalesConversation | undefined;
    if (interaction.gmailThreadId) {
      conversation = byGmailThread.get(interaction.gmailThreadId);
      if (!conversation) {
        conversation = { id: `gmail:${interaction.gmailThreadId}`, gmailThreadId: interaction.gmailThreadId, interactions: [] };
        byGmailThread.set(interaction.gmailThreadId, conversation);
        groups.push(conversation);
      }
    } else {
      const subject = normalizedSubject(interaction.subject);
      const timestamp = Date.parse(interaction.occurredAt);
      const fallbackKey = `${contactKey(interaction)}:${subject}`;
      const contactCandidates = fallbackGroups.get(fallbackKey) || [];
      conversation = contactCandidates.find((candidate) => {
        const last = candidate.interactions[candidate.interactions.length - 1];
        return Math.abs(timestamp - Date.parse(last.occurredAt)) <= FALLBACK_THREAD_WINDOW_MS;
      });

      // Older imports may not have linked the contact on an inbound row. If
      // exactly one known contact thread has the same subject nearby, it is
      // safe to attach the message to that thread. Ambiguous messages remain
      // separate rather than being assigned to the wrong person.
      if (!conversation && !interaction.contactId && !interaction.contactName) {
        const nearby = nearbyFallbackCandidates(fallbackGroups, subject, timestamp);
        if (nearby.length === 1) conversation = nearby[0];
      }

      if (!conversation) {
        conversation = { id: `inferred:${fallbackKey}:${groups.length}`, interactions: [] };
        contactCandidates.push(conversation);
        fallbackGroups.set(fallbackKey, contactCandidates);
        groups.push(conversation);
      }
    }

    addInteraction(conversation, interaction);
  }

  return groups.map((conversation) => ({
    ...conversation,
    interactions: sortInteractions(conversation.interactions),
  }));
}
