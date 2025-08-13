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
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: ENV.SHEETS.SHEET_ID,
    range: `${ENV.SHEETS.TAB_NAME}!A:Z`,
  });
  const values = (data.values || []) as string[][];
  const rows = values.slice(1); // skip header
  cache = { at: now, rows };
  return rows;
}
