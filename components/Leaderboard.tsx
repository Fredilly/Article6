import { TrophyIcon } from "@heroicons/react/24/solid";
import type { Project } from "@/data/projects";

interface LeaderboardProps {
  items: Project[];
}

export default function Leaderboard({ items }: LeaderboardProps) {
  const ranked = [...items].sort((a, b) => b.progress - a.progress);
  const rankColor = (idx: number) => {
    if (idx === 0) return "text-yellow-500";
    if (idx === 1) return "text-gray-400";
    if (idx === 2) return "text-orange-400";
    return "text-gray-500";
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white/50 backdrop-blur-md p-4 shadow-sm max-h-[400px] overflow-auto md:max-h-none">
      <div className="flex items-center gap-2 mb-4">
        <TrophyIcon className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">Leaderboard</h2>
      </div>
      <ul className="space-y-3">
        {ranked.map((p, idx) => {
          const progress = p.progress ?? 0;
          const loading = p.progress === undefined;
          return (
            <li key={p.slug} className="flex items-center gap-3">
              <span className={`w-6 text-sm font-bold ${rankColor(idx)}`}>{idx + 1}</span>
              <span className="flex-1 font-medium">{p.title}</span>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-green-500 transition-all duration-700 ease-out ${loading ? "animate-pulse" : ""}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-sm text-gray-500">{progress}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
