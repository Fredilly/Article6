import { google } from "googleapis";

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

const toBool = (v: any) => String(v ?? "").trim().toUpperCase() === "TRUE";
const toNum  = (v: any) => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};
const t     = (v: any) => String(v ?? "").replace(/\s+$/g,"").trim(); // trim + drop trailing newline

export async function getLeaderboard(): Promise<LiveItem[]> {
  const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "";
  const PRIVATE_KEY  = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "").replace(/\n/g, "\n").includes("\n")
                       ? (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "").replace(/\n/g, "\n").replace(/\\n/g, "\n").replace(/\n/g, "\n")
                       : (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "");
  const SHEET_ID     = process.env.GOOGLE_SHEETS_SHEET_ID || "";
  const TAB_NAME     = process.env.GOOGLE_SHEETS_TAB_NAME || "Leaderboard";

  if (!CLIENT_EMAIL || !PRIVATE_KEY || !SHEET_ID) {
    throw new Error("env_missing");
  }

  const jwt = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth: jwt });

  // Read data rows only
  const range = `${TAB_NAME}!A2:I`; // A: slug, B: title, C: los, D: mou, E: fera, F: meetings_count, G: meetings_30d, H: last_update_iso, I: evidence_urls
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
  const rows = data.values || [];

  return rows.map((r) => {
    const [
      slug, title, los, mou, fera,
      meetings_count, meetings_30d, last_update_iso, evidence_urls
    ] = r;

    return {
      slug: t(slug),
      title: t(title),
      los_signed: toBool(los),
      mou_signed: toBool(mou),
      fera_signed: toBool(fera),
      meetings_count: toNum(meetings_count),
      meetings_30d: toNum(meetings_30d),
      last_update_iso: t(last_update_iso),
      evidence_urls: t(evidence_urls),
    };
  }).filter(x => x.slug);
}

