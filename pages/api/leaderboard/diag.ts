export const runtime = 'nodejs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const token = process.env.DIAG_TOKEN;
  if (token && _req.headers['x-diag-token'] !== token) {
    return res.status(401).json({ ok:false, error:'unauthorized' });
  }
  res.setHeader('X-Robots-Tag','noindex');

  try {
    const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL!;
    const PRIVATE_KEY  = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const SHEET_ID     = process.env.GOOGLE_SHEETS_SHEET_ID!;
    const TAB_NAME     = process.env.GOOGLE_SHEETS_TAB_NAME || 'Leaderboard';

    const jwt = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth: jwt });

    const range = `${TAB_NAME}!A1:Z`; // include header row
    const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
    const rows = data.values || [];

    res.status(200).json({ ok: true, rows });
  } catch (e: any) {
    res.status(500).json({ ok:false, error: e?.message || 'unknown_error' });
  }
}
