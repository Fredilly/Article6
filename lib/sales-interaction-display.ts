export const INTERNAL_SALES_SENDER = "Fred E.";
export const UNKNOWN_EXTERNAL_SENDER = "External contact";

export function relationshipHistoryActor(direction: string, contactName?: string): string {
  return direction.trim().toUpperCase() === "OUTBOUND"
    ? INTERNAL_SALES_SENDER
    : contactName?.trim() || UNKNOWN_EXTERNAL_SENDER;
}
