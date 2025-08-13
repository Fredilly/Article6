import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMetricsRows } from "@/lib/gSheets";
import { computeScore, type Metric } from "@/lib/score";

const HEADERS = ["slug","title","los_signed","mou_signed","fera_signed","meetings_count","meetings_30d","last_update_iso","evidence_urls"];

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const rows = await fetchMetricsRows();
    const items = rows.map(toMetric);
    const withScores = items
      .filter(i => i.slug)
      .map(m => ({ ...m, score: computeScore(m) }))
      .sort((a,b) => b.score.total - a.score.total);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.status(200).json({ items: withScores, updatedAt: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "leaderboard failed" });
  }
}

function toMetric(r: string[]): Metric {
  const get = (name: string) => (r[HEADERS.indexOf(name)] ?? "").trim();
  const bool = (s: string) => s.toUpperCase() === "TRUE";
  const num  = (s: string) => Number(s) || 0;
  const ev   = (s: string) => s.split(";").map(x => x.trim()).filter(Boolean);

  return {
    slug: get("slug"),
    title: get("title") || undefined,
    los_signed: bool(get("los_signed")),
    mou_signed: bool(get("mou_signed")),
    fera_signed: bool(get("fera_signed")),
    meetings_count: num(get("meetings_count")),
    meetings_30d: num(get("meetings_30d")),
    last_update_iso: get("last_update_iso") || undefined,
    evidence_urls: ev(get("evidence_urls")),
  };
}
