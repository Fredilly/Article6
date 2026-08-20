export const INTERNAL_SALES_SENDER = "Fred E.";
export const UNKNOWN_EXTERNAL_SENDER = "External contact";

export type RelationshipHistoryDirection = "OUTBOUND" | "INBOUND";

export interface RelationshipHistoryPresentation {
  direction: RelationshipHistoryDirection;
  actorName: string;
  alignment: "left" | "right";
  recipient?: string;
}

export function normalizeRelationshipHistoryDirection(direction: string): RelationshipHistoryDirection {
  return direction.trim().toUpperCase() === "OUTBOUND" ? "OUTBOUND" : "INBOUND";
}

export function relationshipHistoryActor(direction: string, contactName?: string): string {
  return normalizeRelationshipHistoryDirection(direction) === "OUTBOUND"
    ? INTERNAL_SALES_SENDER
    : contactName?.trim() || UNKNOWN_EXTERNAL_SENDER;
}

export function relationshipHistoryPresentation(direction: string, contactName?: string): RelationshipHistoryPresentation {
  const normalizedDirection = normalizeRelationshipHistoryDirection(direction);
  const isOutbound = normalizedDirection === "OUTBOUND";
  return {
    direction: normalizedDirection,
    actorName: relationshipHistoryActor(normalizedDirection, contactName),
    alignment: isOutbound ? "right" : "left",
    recipient: isOutbound ? contactName?.trim() || undefined : undefined,
  };
}
