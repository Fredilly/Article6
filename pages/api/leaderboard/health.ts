export const runtime = "nodejs";
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { optional, must } from "@/lib/env";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const email = must("GOOGLE_SHEETS_CLIENT_EMAIL");
    const key   = (must("GOOGLE_SHEETS_PRIVATE_KEY")).replace(/\\n/g, "\\n").includes("\\n") ? "escaped" : "multiline";
    const sheet = must("GOOGLE_SHEETS_SHEET_ID");
    const tab   = optional("GOOGLE_SHEETS_TAB_NAME", "Leaderboard");

    // try auth only; no data read (fast)
    const jwt = new google.auth.JWT({
      email,
      key: (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    await jwt.authorize();

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      ok: true,
      usingServiceAccount: email.replace(/^[^@]+/, "***"),
      keyFormat: key,
      sheetIdTail: sheet.slice(-6),
      tab
    });
  } catch (e: any) {
    res.status(500).json({ ok:false, error: e?.message || "unknown_error" });
  }
}
