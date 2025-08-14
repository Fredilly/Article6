export type LiveItem = {
  slug: string;
  title: string;
  los_signed?: boolean;
  mou_signed?: boolean;
  fera_signed?: boolean;
  meetings_30d?: number;
  last_update_iso?: string;
};

export async function getLeaderboard(): Promise<LiveItem[]> {
  try {
    const url = process.env.LEADERBOARD_URL || process.env.LEADERBOARD_SHEET_URL || "";
    if (!url) return [];
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data)) return data as LiveItem[];
    if (Array.isArray((data as any).items)) return (data as any).items as LiveItem[];
    return [];
  } catch {
    return [];
  }
}

