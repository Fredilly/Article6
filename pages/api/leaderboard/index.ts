import type { NextApiRequest, NextApiResponse } from "next";
import { getLeaderboard } from "@/lib/leaderboard";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const items = await getLeaderboard();
    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ items: [] });
  }
}
