export const PROBABLE_BIDDER_STATUS = "PROBABLE BIDDER — NOT CONFIRMED";
export const CONFIRMED_BIDDER_STATUS = "CONFIRMED BIDDER";

export const EDITABLE_BIDDER_STATUSES = [
  { value: "", label: "NOT CLASSIFIED" },
  { value: PROBABLE_BIDDER_STATUS, label: PROBABLE_BIDDER_STATUS },
  { value: CONFIRMED_BIDDER_STATUS, label: CONFIRMED_BIDDER_STATUS },
] as const;

function badgeClass(status?: string): string {
  if (status === PROBABLE_BIDDER_STATUS) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (status === CONFIRMED_BIDDER_STATUS) {
    return "border-green-200 bg-green-50 text-green-700";
  }
  return "border-gray-200 bg-gray-50 text-gray-600";
}

export default function TenderBidderStatusBadge({ status, showUnclassified = false }: { status?: string; showUnclassified?: boolean }) {
  const normalized = status?.trim();
  if (!normalized && !showUnclassified) return null;
  const label = normalized || "NOT CLASSIFIED";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(normalized)}`}>{label}</span>;
}
