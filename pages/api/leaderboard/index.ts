import type { NextApiRequest, NextApiResponse } from 'next';

export const runtime = 'nodejs';

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

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const sheetId = process.env.SHEET_ID;
  const tabName = process.env.TAB_NAME;
  const apiKey = process.env.SHEETS_API_KEY;

  if (!sheetId || !tabName || !apiKey) {
    res.status(500).json({ ok: false, error: 'Missing env vars' });
    return;
  }

  const range = `${tabName}!A2:Z`;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/` +
    `${encodeURIComponent(range)}?majorDimension=ROWS&key=${apiKey}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    res.status(resp.status).json({ ok: false });
    return;
  }

  const data: any = await resp.json();
  const rows: any[][] = data.values || [];
  const items: Item[] = rows.map((row) => ({
    slug: String(row[0] ?? ''),
    title: String(row[1] ?? ''),
    los_signed: String(row[2] ?? '').toUpperCase() === 'TRUE',
    mou_signed: String(row[3] ?? '').toUpperCase() === 'TRUE',
    fera_signed: String(row[4] ?? '').toUpperCase() === 'TRUE',
    meetings_count: Number(row[5] ?? 0) || 0,
    meetings_30d: Number(row[6] ?? 0) || 0,
    last_update_iso: String(row[7] ?? ''),
    evidence_urls: String(row[8] ?? ''),
  }));

  res.status(200).json({ ok: true, items });
}

