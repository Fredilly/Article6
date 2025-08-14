import { google } from "googleapis";
import { must, optional } from "@/lib/env";

export type LeaderboardItem = {
  slug: string;
  title: string;
  progress?: number;
  activityScore?: number;
  lastUpdateISO?: string;
};

export async function getLeaderboard(): Promise<LeaderboardItem[]> {
  const email = must("GOOGLE_SHEETS_CLIENT_EMAIL");
  const key = (must("GOOGLE_SHEETS_PRIVATE_KEY")).replace(/\\n/g, "\n");
  const sheetId = must("GOOGLE_SHEETS_SHEET_ID");
  const tab = optional("GOOGLE_SHEETS_TAB_NAME", "Leaderboard");

  const jwt = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth: jwt });
  const range = `${tab}!A2:E`;
  const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  const rows = resp.data.values || [];

  return rows.map((r) => ({
    slug: r[0] || "",
    title: r[1] || "",
    progress: r[2] ? Number(r[2]) : undefined,
    activityScore: r[3] ? Number(r[3]) : undefined,
    lastUpdateISO: r[4] || undefined,
  }));
}
