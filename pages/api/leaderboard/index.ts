import type { NextApiRequest, NextApiResponse } from "next";

export const runtime = "nodejs";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const upstream =
    process.env.LEADERBOARD_API_URL ||
    "https://example.com/api/leaderboard"; // replace with real URL

  try {
    const r = await fetch(upstream);
    if (!r.ok) throw new Error(`upstream responded ${r.status}`);
    const j = await r.json();
    const items = Array.isArray(j.items) ? j.items : j;
    res.status(200).json({ ok: true, items });
  } catch (e) {
    console.error("leaderboard fetch failed", e);
    res.status(500).json({ ok: false, items: [] });
  }
}

