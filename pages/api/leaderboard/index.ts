import type { NextApiRequest, NextApiResponse } from "next";
import { projects } from "@/data/projects";

export const runtime = "nodejs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const items = projects.map((p) => ({
    slug: p.slug,
    title: p.title,
    los_signed: false,
    mou_signed: false,
    fera_signed: false,
    meetings_count: 0,
    meetings_30d: 0,
    last_update_iso: p.lastUpdateISO,
  }));

  res.status(200).json({ ok: true, items });
}
