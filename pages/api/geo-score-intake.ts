import { timingSafeEqual } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  storeGeoScoreLead,
  type GeoScoreLeadInput,
  type GeoScoreMainGoal,
} from "../../lib/geo-score-intake";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOALS = new Set<GeoScoreMainGoal>([
  "Improve AI visibility",
  "Improve search discoverability",
  "Understand website weaknesses",
  "Website upgrade",
]);

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function authorized(req: NextApiRequest): boolean {
  const expected = process.env.GEO_SCORE_INTAKE_SECRET || "";
  const provided = req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || !provided) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

function validPublicWebsite(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function boundedCategoryScores(value: unknown): Record<string, number | null> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result: Record<string, number | null> = {};

  for (const [key, raw] of Object.entries(value as Record<string, unknown>).slice(0, 5)) {
    const name = clean(key, 40);
    if (!name) continue;
    result[name] = raw == null ? null : typeof raw === "number" && raw >= 0 && raw <= 100 ? raw : null;
  }

  return Object.keys(result).length ? result : undefined;
}

function boundedFindings(value: unknown): Array<{ title: string; explanation?: string }> | undefined {
  if (!Array.isArray(value)) return undefined;
  const findings = value.slice(0, 3).map((item) => ({
    title: clean(item?.title, 180),
    explanation: clean(item?.explanation, 500) || undefined,
  })).filter((item) => item.title);

  return findings.length ? findings : undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!authorized(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const mainGoal = clean(req.body?.mainGoal, 80) as GeoScoreMainGoal;
  const input: GeoScoreLeadInput = {
    name: clean(req.body?.name, 120),
    email: clean(req.body?.email, 254).toLowerCase(),
    company: clean(req.body?.company, 180),
    websiteUrl: clean(req.body?.websiteUrl, 1000),
    mainGoal,
    notes: clean(req.body?.notes, 3000) || undefined,
    overallScore:
      req.body?.overallScore == null
        ? null
        : typeof req.body.overallScore === "number" && req.body.overallScore >= 0 && req.body.overallScore <= 100
          ? req.body.overallScore
          : null,
    categoryScores: boundedCategoryScores(req.body?.categoryScores),
    topFindings: boundedFindings(req.body?.topFindings),
    analyzedAt: clean(req.body?.analyzedAt, 80) || undefined,
    scoringVersion: clean(req.body?.scoringVersion, 80) || undefined,
  };

  if (!input.name || !input.email || !input.company || !input.websiteUrl || !input.mainGoal) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (!EMAIL_RE.test(input.email)) {
    return res.status(400).json({ error: "Enter a valid email." });
  }

  if (!GOALS.has(input.mainGoal)) {
    return res.status(400).json({ error: "Invalid main goal." });
  }

  if (!validPublicWebsite(input.websiteUrl)) {
    return res.status(400).json({ error: "Enter a valid website URL." });
  }

  if (input.analyzedAt && Number.isNaN(Date.parse(input.analyzedAt))) {
    return res.status(400).json({ error: "Invalid analysis timestamp." });
  }

  try {
    await storeGeoScoreLead(input);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[geo-score] Failed to store inbound lead", error);
    return res.status(500).json({ error: "We could not submit this request. Please try again." });
  }
}
