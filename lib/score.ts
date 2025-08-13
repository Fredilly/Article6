import W from "@/config/leaderboardWeights";

export type Metric = {
  slug: string;
  title?: string;
  los_signed?: boolean;
  mou_signed?: boolean;
  fera_signed?: boolean;
  meetings_count?: number;
  meetings_30d?: number;
  last_update_iso?: string;
  evidence_urls?: string[];
};
export type Score = { docs: number; meetings: number; recency: number; momentum: number; total: number };

export function computeScore(m: Metric): Score {
  const docs = (m.los_signed ? W.docs.los : 0)
            + (m.mou_signed ? W.docs.mou : 0)
            + (m.fera_signed ? W.docs.fera : 0);

  const mc = clamp(m.meetings_count || 0);
  const meetings = Math.round(W.meetingsMax * Math.min(1, Math.log(1 + mc) / Math.log(11)));

  const recency = recencyScore(m.last_update_iso || "", W.recencyMax);

  const m30 = clamp(m.meetings_30d || 0);
  const momentum = Math.min(W.momentumCap, m30 * W.momentumPerMeeting);

  return { docs, meetings, recency, momentum, total: docs + meetings + recency + momentum };
}

function clamp(n: number) { return Math.max(0, Number.isFinite(n) ? n : 0); }
function recencyScore(iso: string, max: number) {
  const t = Date.parse(iso || "");
  if (!Number.isFinite(t)) return 0;
  const days = Math.max(0, (Date.now() - t) / 86400000);
  return Math.max(0, Math.round(max * (1 - Math.min(1, days / 30))));
}
