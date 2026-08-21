export type SalesTimestampInput = string | number | Date;

export function normalizeSalesInteractionTimestamp(value: SalesTimestampInput): string {
  const numericValue = typeof value === "number" ? value : typeof value === "string" && /^\d{10,13}$/.test(value.trim()) ? Number(value) : undefined;
  const parsedValue = numericValue == null ? value : numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
  const parsed = new Date(parsedValue);
  if (Number.isNaN(parsed.getTime())) throw new Error("Interaction timestamp is invalid.");
  return parsed.toISOString();
}
