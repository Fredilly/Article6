export const runtime = "nodejs";
import type { NextApiRequest, NextApiResponse } from "next";
import { getLeaderboard } from "@/lib/leaderboard";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const items = await getLeaderboard();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ ok: true, items });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "unknown_error" });
  }
}
