import type { NextApiRequest, NextApiResponse } from "next";
import { projects } from "@/data/projects";

export const runtime = "nodejs";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const items = projects;
  res.status(200).json({ ok: true, items });
}

