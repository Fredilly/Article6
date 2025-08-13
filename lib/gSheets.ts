import { google } from "googleapis";
import { ENV } from "@/config/env";

const ttlMs = ENV.CACHE_TTL_SECONDS * 1000;
let cache: { at: number; rows: string[][] } | null = null;

export async function fetchMetricsRows() {
  const now = Date.now();
  if (cache && now - cache.at < ttlMs) return cache.rows;

  const jwt = new google.auth.JWT({
    email: ENV.SHEETS.CLIENT_EMAIL,
    key: ENV.SHEETS.PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth: jwt });

  // cheap metadata call helps catch project/API issues during diag
  await sheets.spreadsheets.get({ spreadsheetId: ENV.SHEETS.SHEET_ID });

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: ENV.SHEETS.SHEET_ID,
    range: `${ENV.SHEETS.TAB_NAME}!A:Z`,
  });
  const values = (data.values || []) as string[][];
  const rows = values.slice(1);
  cache = { at: now, rows };
  return rows;
}
