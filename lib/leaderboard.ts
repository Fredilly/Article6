import { google } from "googleapis";

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

const toBool = (v: any) => String(v).toUpperCase() === "TRUE";
const toNum  = (v: any) => (v === "" || v == null ? 0 : Number(v));

export async function getLeaderboard(): Promise<LiveItem[]> {
  const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "";
  const PRIVATE_KEY  = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "").replace(/\\n/g, "\n");
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

  const range = `${TAB_NAME}!A2:Z`; // data rows only
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
  const rows = data.values || [];

  return rows
    .map((r) => {
      const [
        slug, title, los, mou, fera,
        meetings_count, meetings_30d, last_update_iso, evidence_urls
      ] = r;

      return {
        slug: String(slug || "").trim(),
        title: String(title || "").trim(),
        los_signed: toBool(los),
        mou_signed: toBool(mou),
        fera_signed: toBool(fera),
        meetings_count: toNum(meetings_count),
        meetings_30d: toNum(meetings_30d),
        last_update_iso: String(last_update_iso || "").trim(),
        evidence_urls: String(evidence_urls || "").trim(),
      } as LiveItem;
    })
    .filter(x => x.slug);
}
