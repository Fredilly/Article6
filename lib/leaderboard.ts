export type LiveItem = {
  slug: string;
  title: string;
  los_signed?: boolean;
  mou_signed?: boolean;
  fera_signed?: boolean;
  meetings_count?: number;
  meetings_30d?: number;
  last_update_iso?: string;
};

export async function getLeaderboard(): Promise<LiveItem[]> {
  return [
    { slug: "niger", title: "Niger State", los_signed: true, meetings_count: 3, meetings_30d: 1, last_update_iso: "2024-08-10" },
    { slug: "kwara", title: "Kwara State", meetings_count: 0, meetings_30d: 0, last_update_iso: "2024-07-05" },
    { slug: "plateau", title: "Plateau State", mou_signed: true, meetings_count: 2, meetings_30d: 1, last_update_iso: "2024-06-20" }
  ];
}
