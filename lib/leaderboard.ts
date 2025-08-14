import { google } from "googleapis";
import { must, optional } from "@/lib/env";
import { computeScore, ScoreInput } from "./score";

export interface Item extends ScoreInput {
  slug: string;
  title: string;
  epithet?: string;
}

export async function getLeaderboard(): Promise<Item[]> {
  const auth = new google.auth.JWT({
    email: must("GOOGLE_SHEETS_CLIENT_EMAIL"),
    key: must("GOOGLE_SHEETS_PRIVATE_KEY").replace(/\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const sheetId = must("GOOGLE_SHEETS_SHEET_ID");
  const tab = optional("GOOGLE_SHEETS_TAB_NAME", "Leaderboard");
  const range = `${tab}!A2:F`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  const rows = res.data.values || [];

  return rows.map((r) => {
    const [slug, title, progress, activityScore, lastUpdateISO, epithet] = r;
    const base: ScoreInput = {
      progress: Number(progress) || 0,
      activityScore: Number(activityScore) || 0,
      lastUpdateISO: lastUpdateISO || undefined,
    };
    return {
      slug,
      title,
      epithet,
      ...base,
      score: computeScore(base),
    };
  });
}
