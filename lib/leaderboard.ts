import { google } from "googleapis";

// Expected headers (case/spacing-insensitive): 
// slug, title, los_signed, mou_signed, fera_signed, meetings_count, meetings_30d, last_update_iso, evidence_urls
export type LiveItem = {
  slug: string;
  title: string;
  los_signed: boolean;
  mou_signed: boolean;
  fera_signed: boolean;
  meetings_count: number;
  meetings_30d: number;
  last_update_iso: string;   // YYYY-MM-DD or ""
  evidence_urls: string;     // comma-separated or ""
};

// Cache the last fetched leaderboard along with an expiry timestamp.
let cache: { expires: number; data: LiveItem[] } | null = null;
const ttlMs = parseInt(process.env.LEADERBOARD_CACHE_TTL || "300", 10) * 1000; // default 5m

const trimEndNewlines = (s: string) => s.replace(/\s+$/g, "").trim();
const t = (v: any) => trimEndNewlines(String(v ?? ""));
const toBool = (v: any) => {
  const s = t(v).toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
};
const toNum = (v: any) => {
  const s = t(v);
  if (s === "") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
const norm = (s: any) => t(s).toLowerCase().replace(/\s+/g, "_");

function resolveKey(keyRaw: string): string {
  // Supports both escaped and multiline keys
  return keyRaw.includes("\\n") ? keyRaw.replace(/\\n/g, "\n") : keyRaw;
}

export async function getLeaderboard(): Promise<LiveItem[]> {
  // Return cached data if fresh
  if (cache && cache.expires > Date.now()) {
    return cache.data;
  }

  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "";
  const key = resolveKey(process.env.GOOGLE_SHEETS_PRIVATE_KEY || "");
  const sheetId = process.env.GOOGLE_SHEETS_SHEET_ID || "";
  const tab = process.env.GOOGLE_SHEETS_TAB_NAME || "Leaderboard";
  if (!email || !key || !sheetId) throw new Error("env_missing");

  const jwt = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
  const sheets = google.sheets({ version: "v4", auth: jwt });

  // Read header + data in one go
  const range = `${tab}!A1:Z`;
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  const rows = data.values || [];
  if (rows.length === 0) return [];

  const header = rows[0].map(norm);
  const idx = (name: string, ...alts: string[]) => {
    const want = [name, ...alts];
    for (const w of want) {
      const i = header.indexOf(w);
      if (i >= 0) return i;
    }
    return -1;
  };

  const cSlug  = idx("slug");
  const cTitle = idx("title");
  const cLos   = idx("los_signed","los");
  const cMou   = idx("mou_signed","mou");
  const cFera  = idx("fera_signed","fera");
  const cCnt   = idx("meetings_count","meetings_total","total_meetings");
  const c30d   = idx("meetings_30d","meetings30d","m30d");
  const cIso   = idx("last_update_iso","last_update","updated_at","update_iso");
  const cUrls  = idx("evidence_urls","evidence","links");

  const out: LiveItem[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const at = (i: number) => (i >= 0 ? row[i] : "");
    const slug = t(at(cSlug));
    if (!slug) continue;
    out.push({
      slug,
      title: t(at(cTitle)) || slug,
      los_signed: toBool(at(cLos)),
      mou_signed: toBool(at(cMou)),
      fera_signed: toBool(at(cFera)),
      meetings_count: toNum(at(cCnt)),
      meetings_30d: toNum(at(c30d)),
      last_update_iso: t(at(cIso)),
      evidence_urls: t(at(cUrls)),
    });
  }

  // Dedupe by slug (last write wins)
  const map = new Map<string, LiveItem>();
  for (const it of out) map.set(it.slug, it);
  const arr = Array.from(map.values());
  // Update cache before returning
  cache = { data: arr, expires: Date.now() + ttlMs };
  return arr;
}

