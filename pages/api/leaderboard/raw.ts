export const runtime = "nodejs";
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "";
    const key   = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "").replace(/\n/g, "\n");
    const id    = process.env.GOOGLE_SHEETS_SHEET_ID || "";
    const tab   = process.env.GOOGLE_SHEETS_TAB_NAME || "Leaderboard";
    const jwt = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
    const sheets = google.sheets({ version: "v4", auth: jwt });
    const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${tab}!A1:I10` });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ ok: true, sample: data.values || [] });
  } catch (e: any) {
    res.status(500).json({ ok:false, error: e?.message || "unknown_error" });
  }
}

