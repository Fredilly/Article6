export const runtime = 'nodejs';
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { ENV } from "@/config/env";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const jwt = new google.auth.JWT({
      email: ENV.SHEETS.CLIENT_EMAIL,
      key: ENV.SHEETS.PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth: jwt });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: ENV.SHEETS.SHEET_ID });
    const title = meta.data.properties?.title;
    const range = `${ENV.SHEETS.TAB_NAME}!A:Z`;
    const vals = await sheets.spreadsheets.values.get({ spreadsheetId: ENV.SHEETS.SHEET_ID, range });
    res.status(200).json({ ok: true, title, range, rows: vals.data.values?.length ?? 0 });
  } catch (e: any) {
    res.status(500).json({
      ok: false,
      error: { message: e?.message || String(e), code: e?.code ?? null, errors: e?.errors ?? null },
      env: { tab: ENV.SHEETS.TAB_NAME, sheetIdTail: ENV.SHEETS.SHEET_ID.slice(-6) }
    });
  }
}
