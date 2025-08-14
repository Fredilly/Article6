export const runtime = "nodejs";
import type { NextApiRequest, NextApiResponse } from "next";
import { getLeaderboard } from "@/lib/leaderboard";
import { enrich, sortByTotal } from "@/lib/scoring";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const live = await getLeaderboard();
    const items = live.map(enrich).sort(sortByTotal);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
    res.status(200).json({ ok: true, items, version: "tabs-tsm-v1" });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "unknown_error" });
  }
}
