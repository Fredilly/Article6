function req(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing required env: ${name}`);
  return v;
}
function getPrivateKey(): string {
  const raw = req("GOOGLE_SHEETS_PRIVATE_KEY");
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}
export const ENV = {
  SHEETS: {
    CLIENT_EMAIL: req("GOOGLE_SHEETS_CLIENT_EMAIL"),
    PRIVATE_KEY: getPrivateKey(),
    SHEET_ID: req("GOOGLE_SHEETS_SHEET_ID"),
    TAB_NAME: process.env.GOOGLE_SHEETS_TAB_NAME || "Sheet1",
  },
  CACHE_TTL_SECONDS: Number(process.env.LEADERBOARD_CACHE_TTL_SECONDS || 300),
} as const;
