export type ScoreInput = {
  progress?: number;        // 0–100
  activityScore?: number;   // 0–100
  lastUpdateISO?: string;   // ISO
};
export function computeScore(x: ScoreInput) {
  const p = clamp(x.progress ?? 0);
  const a = clamp(x.activityScore ?? 0);
  const recency = recencyBoost(x.lastUpdateISO);
  // Weighted: progress 60%, activity 30%, recency 10%
  return Math.round(p * 0.6 + a * 0.3 + recency * 0.1);
}
function clamp(n: number) { return Math.max(0, Math.min(100, n)); }
function recencyBoost(iso?: string) {
  if (!iso) return 0;
  const days = Math.max(0, (Date.now() - Date.parse(iso)) / 86400000);
  // 100 → 0 over ~30 days
  const val = Math.max(0, 100 - (days / 30) * 100);
  return Math.round(val);
}
