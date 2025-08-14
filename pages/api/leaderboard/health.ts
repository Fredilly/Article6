export const runtime = "nodejs";
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "";
    const key = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "").replace(/\\n/g, "\\n").includes("\\n")
      ? (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "").replace(/\\n/g, "\n")
      : (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "");
    const sheet = process.env.GOOGLE_SHEETS_SHEET_ID || "";
    const tab = process.env.GOOGLE_SHEETS_TAB_NAME || "Leaderboard";
    const jwt = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
    await jwt.authorize();
    res.setHeader("Cache-Control","no-store");
    res.status(200).json({ ok:true, usingServiceAccount: email.replace(/^[^@]+/,"***"), sheetIdTail: sheet.slice(-6), tab });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e?.message || "unknown_error" });
  }
}
