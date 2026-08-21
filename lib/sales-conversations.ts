import type { SalesInteraction } from "./sales-store";

const FALLBACK_THREAD_WINDOW_MS = 72 * 60 * 60 * 1000;

export interface SalesConversation {
  id: string;
  contactId?: string;
  contactName?: string;
  gmailThreadId?: string;
  subject?: string;
  interactions: SalesInteraction[];
}

function normalizedSubject(subject?: string): string {
  return (subject || "").trim().replace(/^(re|fwd?):\s*/i, "").replace(/\s+/g, " ").toLowerCase();
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
      if (!interaction.contactId && !interaction.contactName) {
        conversation = { id: `unassigned:${groups.length}`, interactions: [] };
        groups.push(conversation);
      }
      if (conversation) {
        conversation.contactId ||= interaction.contactId;
        conversation.contactName ||= interaction.contactName;
        conversation.subject ||= interaction.subject;
        conversation.interactions.push(interaction);
        continue;
      }
      const fallbackKey = `${contactKey(interaction)}:${normalizedSubject(interaction.subject)}`;
      const candidates = fallbackGroups.get(fallbackKey) || [];
      const timestamp = Date.parse(interaction.occurredAt);
      conversation = candidates.find((candidate) => {
        const last = candidate.interactions[candidate.interactions.length - 1];
        return Math.abs(timestamp - Date.parse(last.occurredAt)) <= FALLBACK_THREAD_WINDOW_MS;
      });
      if (!conversation) {
        conversation = { id: `inferred:${fallbackKey}:${groups.length}`, interactions: [] };
        candidates.push(conversation);
        fallbackGroups.set(fallbackKey, candidates);
        groups.push(conversation);
      }
    }

    conversation.contactId ||= interaction.contactId;
    conversation.contactName ||= interaction.contactName;
    conversation.subject ||= interaction.subject;
    conversation.interactions.push(interaction);
  }

  return groups.map((conversation) => ({
    ...conversation,
    interactions: sortInteractions(conversation.interactions),
  }));
}
