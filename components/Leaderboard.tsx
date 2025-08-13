import React from "react";
import { TrophyIcon } from "@heroicons/react/24/solid";
import { leaderboard } from "@/data/leaderboard";

const medalColors = [
  "text-yellow-500",
  "text-gray-400",
  "text-amber-700",
];

export default function Leaderboard() {
  const entries = [...leaderboard].sort((a, b) => b.points - a.points);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Leaderboard</h2>
      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {entries.map((entry, idx) => (
          <li key={entry.name} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {idx < 3 ? (
                <TrophyIcon className={`h-5 w-5 ${medalColors[idx]}`} />
              ) : (
                <span className="w-5 text-sm text-gray-500">{idx + 1}</span>
              )}
              <span className="font-medium">{entry.name}</span>
            </div>
            <span className="text-sm text-gray-700">{entry.points} pts</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
