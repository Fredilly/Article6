export type LiveItem = {
  slug: string;
  title: string;
  los_signed?: boolean;
  mou_signed?: boolean;
  fera_signed?: boolean;
  meetings_count?: number;
  meetings_30d?: number;
  last_update_iso?: string;
  evidence_urls?: string;
};

function parseBool(v: any): boolean | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return undefined;
}

function parseNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function getLeaderboard(): Promise<LiveItem[]> {
  const sheetId = process.env.LEADERBOARD_SHEET_ID;
  const gid = process.env.LEADERBOARD_GID || "0";
  if (!sheetId) return [];
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const rows = text.trim().split(/\r?\n/).map((l) => l.split(","));
    const header = rows.shift() || [];
    const items: LiveItem[] = [];
    for (const row of rows) {
      const obj: any = {};
      header.forEach((h, i) => (obj[h] = row[i]));
      if (!obj.slug) continue;
      items.push({
        slug: obj.slug,
        title: obj.title,
        los_signed: parseBool(obj.los_signed),
        mou_signed: parseBool(obj.mou_signed),
        fera_signed: parseBool(obj.fera_signed),
        meetings_count: parseNum(obj.meetings_count),
        meetings_30d: parseNum(obj.meetings_30d),
        last_update_iso: obj.last_update_iso,
        evidence_urls: obj.evidence_urls,
      });
    }
    return items;
  } catch {
    return [];
  }
}
