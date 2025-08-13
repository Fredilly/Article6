export const runtime = 'nodejs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchMetricsRows } from '@/lib/gSheets';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const rows = await fetchMetricsRows();
    res.status(200).json({ ok: true, rows });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
