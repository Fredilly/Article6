import type { NextApiRequest, NextApiResponse } from 'next';

export const runtime = 'nodejs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('X-Robots-Tag', 'noindex');

  const sheetId = process.env.SHEET_ID;
  const apiKey = process.env.SHEETS_API_KEY;
  const tabName = (req.query.tab as string) || process.env.TAB_NAME || '';
  const range =
    (req.query.range as string) || `${tabName ? tabName + '!' : ''}A1:Z`;

  const diagToken = process.env.DIAG_TOKEN;
  if (diagToken && req.headers['x-diag-token'] !== diagToken) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  if (!sheetId || !apiKey) {
    res.status(500).json({ ok: false, error: 'Missing env vars' });
    return;
  }

  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`;
  const valuesUrl =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/` +
    `${encodeURIComponent(range)}?key=${apiKey}`;

  const [metaResp, valuesResp] = await Promise.all([
    fetch(metaUrl),
    fetch(valuesUrl),
  ]);

  const meta = await metaResp.json();
  const values = await valuesResp.json();

  const rows = Array.isArray(values.values) ? values.values.length : 0;
  const keyHasEscapes = (process.env.GOOGLE_PRIVATE_KEY || '').includes('\\n');

  res.status(200).json({ ok: true, rows, keyHasEscapes, meta, values });
}

