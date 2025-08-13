import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

function ok(v?: string) { return v && v.trim() ? "set" : "missing"; }

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const env = {
    CLIENT_EMAIL: ok(process.env.GOOGLE_SHEETS_CLIENT_EMAIL),
    PRIVATE_KEY: ok(process.env.GOOGLE_SHEETS_PRIVATE_KEY),
    SHEET_ID: process.env.GOOGLE_SHEETS_SHEET_ID || "",
    TAB_NAME: process.env.GOOGLE_SHEETS_TAB_NAME || "Sheet1",
  };

  // Quick fail if anything critical is missing
  if (env.CLIENT_EMAIL !== "set" || env.PRIVATE_KEY !== "set" || !env.SHEET_ID) {
    return res.status(400).json({ step: "env", env, hint: "Fill env vars and redeploy." });
  }

  // Normalize key newlines
  const key = (process.env.GOOGLE_SHEETS_PRIVATE_KEY as string).includes("\\n")
    ? (process.env.GOOGLE_SHEETS_PRIVATE_KEY as string).replace(/\\n/g, "\n")
    : (process.env.GOOGLE_SHEETS_PRIVATE_KEY as string);

  try {
    const jwt = new google.auth.JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth: jwt });

    // Step A: metadata (cheap) — catches project/API enablement issues
    const meta = await sheets.spreadsheets.get({ spreadsheetId: env.SHEET_ID });
    const title = meta.data.properties?.title;

    // Step B: values (actual permission on the tab/range)
    const range = `${env.TAB_NAME}!A:Z`;
    const vals = await sheets.spreadsheets.values.get({ spreadsheetId: env.SHEET_ID, range });
    const rows = vals.data.values?.length ?? 0;

    return res.status(200).json({
      ok: true,
      title,
      range,
      rows,
      note: "If rows <= 1, your header/data might be missing."
    });
  } catch (e: any) {
    const err = {
      code: e?.code ?? null,
      errors: e?.errors ?? null,
      message: e?.message ?? String(e),
    };
    return res.status(500).json({ ok: false, env: { ...env, PRIVATE_KEY: "set?" }, error: err });
  }
}
