import type { LiveItem } from "@/lib/leaderboard";

export type ScoredItem = LiveItem & {
  score: number;         // 0..100
  docs_signed: number;   // 0..3
  stage_label: "Prospect" | "LOS" | "MOU" | "FERA";
  stage_rank: 0 | 1 | 2 | 3;
};

export function docsSignedCount(x: LiveItem): number {
  return (x.los_signed ? 1 : 0) + (x.mou_signed ? 1 : 0) + (x.fera_signed ? 1 : 0);
}
export function stageOf(x: LiveItem): { label: ScoredItem["stage_label"]; rank: ScoredItem["stage_rank"] } {
  if (x.fera_signed) return { label: "FERA", rank: 3 };
  if (x.mou_signed)  return { label: "MOU",  rank: 2 };
  if (x.los_signed)  return { label: "LOS",  rank: 1 };
  return { label: "Prospect", rank: 0 };
}
export function computeScore(x: LiveItem): number {
  const docsPts = docsSignedCount(x) * 30;             // 0..90
  const mtgPts  = (x.meetings_count ?? 0) > 0 ? 10 : 0;       // 0 or 10
  return Math.min(100, docsPts + mtgPts);
}
export function enrich(x: LiveItem): ScoredItem {
  const st = stageOf(x);
  return {
    ...x,
    score: computeScore(x),
    docs_signed: docsSignedCount(x),
    stage_label: st.label,
    stage_rank:  st.rank,
  };
}

// Sorters (descending)
export function sortByTotal(a: ScoredItem, b: ScoredItem) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.stage_rank !== a.stage_rank) return b.stage_rank - a.stage_rank;
  if ((b.meetings_30d||0) !== (a.meetings_30d||0)) return (b.meetings_30d||0) - (a.meetings_30d||0);
  const ta = a.last_update_iso ? new Date(a.last_update_iso).getTime() : 0;
  const tb = b.last_update_iso ? new Date(b.last_update_iso).getTime() : 0;
  return tb - ta;
}
export function sortBySigned(a: ScoredItem, b: ScoredItem) {
  if (b.docs_signed !== a.docs_signed) return b.docs_signed - a.docs_signed;
  return sortByTotal(a,b);
}
export function sortByMeetings(a: ScoredItem, b: ScoredItem) {
  if ((b.meetings_count||0) !== (a.meetings_count||0)) return (b.meetings_count||0) - (a.meetings_count||0);
  if ((b.meetings_30d||0) !== (a.meetings_30d||0))   return (b.meetings_30d||0) - (a.meetings_30d||0);
  return sortByTotal(a,b);
}
