export const runtime = 'nodejs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const toBool = (v: any) => String(v).toUpperCase() === 'TRUE';
const toNum = (v: any) => (v === '' || v == null ? 0 : Number(v));

type Item = {
  slug: string;
  title: string;
  los_signed: boolean;
  mou_signed: boolean;
  fera_signed: boolean;
  meetings_count: number;
  meetings_30d: number;
  last_update_iso: string;
  evidence_urls: string;
};

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL!;
    const PRIVATE_KEY = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const SHEET_ID = process.env.GOOGLE_SHEETS_SHEET_ID!;
    const TAB_NAME = process.env.GOOGLE_SHEETS_TAB_NAME || 'Leaderboard';

    const jwt = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth: jwt });

    const range = `${TAB_NAME}!A2:Z`; // data-only
    const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
    const rows = data.values || [];

    const items: Item[] = rows
      .map((r) => {
        const [
          slug,
          title,
          los_signed,
          mou_signed,
          fera_signed,
          meetings_count,
          meetings_30d,
          last_update_iso,
          evidence_urls,
        ] = r;

        return {
          slug: String(slug || '').trim(),
          title: String(title || '').trim(),
          los_signed: toBool(los_signed),
          mou_signed: toBool(mou_signed),
          fera_signed: toBool(fera_signed),
          meetings_count: toNum(meetings_count),
          meetings_30d: toNum(meetings_30d),
          last_update_iso: String(last_update_iso || '').trim(),
          evidence_urls: String(evidence_urls || '').trim(),
        };
      })
      .filter((x) => x.slug);

    res.status(200).json({ ok: true, items });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'unknown_error' });
  }
}

