import type { SalesInteraction, SalesOrganization, SalesTenderOpportunity } from "./sales-store";

const DAY_MS = 24 * 60 * 60 * 1000;

export type EffectiveTenderLifecycle = "LIVE" | "SUBMITTED" | "EXPIRED" | "AWARDED" | "LOST" | "UNKNOWN";
export type TenderUrgency = "GREEN" | "AMBER" | "ORANGE" | "RED" | "EXPIRED" | "UNKNOWN";

export function getTenderDaysRemaining(deadline?: string, now = new Date()): number | undefined {
  if (!deadline) return undefined;
  const deadlineTime = Date.parse(deadline);
  if (!Number.isFinite(deadlineTime)) return undefined;
  return Math.ceil((deadlineTime - now.getTime()) / DAY_MS);
}

export function getTenderUrgency(deadline?: string, now = new Date()): TenderUrgency {
  const days = getTenderDaysRemaining(deadline, now);
  if (days == null) return "UNKNOWN";
  if (days < 0) return "EXPIRED";
  if (days <= 2) return "RED";
  if (days <= 6) return "ORANGE";
  if (days <= 14) return "AMBER";
  return "GREEN";
}

export function getEffectiveTenderLifecycle(tender: Pick<SalesTenderOpportunity, "status" | "submissionDeadline">, now = new Date()): EffectiveTenderLifecycle {
  if (tender.status === "AWARDED") return "AWARDED";
  if (tender.status === "NOT_AWARDED") return "LOST";
  if (tender.status === "SUBMITTED") return "SUBMITTED";
  if (!tender.submissionDeadline || !Number.isFinite(Date.parse(tender.submissionDeadline))) return "UNKNOWN";
  return Date.parse(tender.submissionDeadline) < now.getTime() ? "EXPIRED" : "LIVE";
}

export function getNearestRelevantTender(tenders: SalesTenderOpportunity[], now = new Date()): SalesTenderOpportunity | undefined {
  const withDeadline = tenders.filter((tender) => tender.submissionDeadline && Number.isFinite(Date.parse(tender.submissionDeadline)));
  const live = withDeadline
    .filter((tender) => getEffectiveTenderLifecycle(tender, now) === "LIVE")
    .sort((a, b) => Date.parse(a.submissionDeadline!) - Date.parse(b.submissionDeadline!));
  if (live[0]) return live[0];

  const unresolved = withDeadline
    .filter((tender) => {
      const lifecycle = getEffectiveTenderLifecycle(tender, now);
      return lifecycle === "SUBMITTED" || lifecycle === "UNKNOWN";
    })
    .sort((a, b) => Math.abs(Date.parse(a.submissionDeadline!) - now.getTime()) - Math.abs(Date.parse(b.submissionDeadline!) - now.getTime()));
  if (unresolved[0]) return unresolved[0];

  const expired = withDeadline
    .filter((tender) => getEffectiveTenderLifecycle(tender, now) === "EXPIRED")
    .sort((a, b) => Date.parse(b.submissionDeadline!) - Date.parse(a.submissionDeadline!));
  return expired[0];
}

function plural(count: number, singular: string, pluralValue = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralValue}`;
}

function shortDate(value: string, now = new Date()) {
  const date = new Date(value);
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return "today";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function channelLabel(channel?: string) {
  if (!channel) return "interaction";
  return channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase();
}

function isReply(interaction: SalesInteraction) {
  if (interaction.direction !== "INBOUND") return false;
  const channel = interaction.channel.toUpperCase();
  return channel === "EMAIL" || channel === "WHATSAPP" || channel === "SMS" || /reply|response|message/i.test(interaction.interactionType);
}

export function getOrganizationStatusSummary(
  organization: SalesOrganization,
  interactions: SalesInteraction[],
  tenders: SalesTenderOpportunity[],
  now = new Date(),
): string[] {
  const ordered = [...interactions].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  const outbound = interactions.filter((interaction) => interaction.direction === "OUTBOUND");
  const inbound = interactions.filter((interaction) => interaction.direction === "INBOUND");
  const replies = interactions.filter(isReply);
  const calls = interactions.filter((interaction) => interaction.channel.toUpperCase() === "CALL");
  const latest = ordered[0];
  const latestInbound = ordered.find((interaction) => interaction.direction === "INBOUND");
  const proposal = ordered.find((interaction) => /proposal/i.test(`${interaction.interactionType} ${interaction.subject || ""} ${interaction.summary}`));
  const nearestTender = getNearestRelevantTender(tenders, now);
  const days = nearestTender ? getTenderDaysRemaining(nearestTender.submissionDeadline, now) : undefined;
  const lines: string[] = [];

  if (organization.status === "CONTACTED") {
    lines.push(plural(outbound.length, "outbound touch", "outbound touches"));
    if (latest) lines.push(`Last: ${channelLabel(latest.channel)} · ${shortDate(latest.occurredAt, now)}`);
    lines.push(replies.length ? `${plural(replies.length, "reply")} recorded` : inbound.length ? `${plural(inbound.length, "inbound interaction")} recorded` : "No reply recorded");
  } else if (organization.status === "ENGAGED") {
    if (replies.length) lines.push(plural(replies.length, "reply"));
    if (calls.length) lines.push(plural(calls.length, "call"));
    if (!replies.length && !calls.length && inbound.length) lines.push(plural(inbound.length, "inbound interaction"));
    if (latestInbound) lines.push(`Last meaningful engagement: ${shortDate(latestInbound.occurredAt, now)}`);
    if (latestInbound?.summary) lines.push(latestInbound.summary);
  } else if (organization.status === "OPPORTUNITY") {
    if (proposal) lines.push("Proposal sent");
    if (latestInbound?.summary) lines.push(latestInbound.summary);
    if (days != null) lines.push(days >= 0 ? `Tender due in ${days} day${days === 1 ? "" : "s"}` : `Tender expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`);
    if (organization.nextAction) lines.push(`Next: ${organization.nextAction}`);
  } else if (organization.status === "NURTURE") {
    if (inbound.length) lines.push("Relationship established");
    lines.push("No active buying moment");
    if (organization.nextAction) lines.push(`Next trigger: ${organization.nextAction}`);
  } else {
    if (latest) lines.push(`Last: ${channelLabel(latest.channel)} · ${shortDate(latest.occurredAt, now)}`);
    if (organization.nextAction) lines.push(`Next: ${organization.nextAction}`);
  }

  return lines.filter(Boolean).slice(0, 4);
}
