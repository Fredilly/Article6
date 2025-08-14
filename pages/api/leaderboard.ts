import type { NextApiRequest, NextApiResponse } from "next";
import { getLeaderboard } from "@/lib/leaderboard";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const items = await getLeaderboard();
    res.status(200).json({ ok: true, items });
  } catch (err: any) {
    res.status(500).json({ ok: false, items: [], error: err?.message || "failed" });
  }
}
