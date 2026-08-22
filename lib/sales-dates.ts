export function salesDateTimeLocalToIso(value: string): string {
  if (!value.trim()) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid local date-time.");
  return parsed.toISOString();
}

export function normalizeSalesDateTime(value?: string): string | null {
  const trimmed = value?.trim() || "";
  if (!trimmed) return null;
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) throw new Error("Sales dates must include an explicit timezone.");
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid sales date-time.");
  return parsed.toISOString();
}
