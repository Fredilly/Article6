import * as React from "react";

export default function FactCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border bg-white/5 backdrop-blur p-4 shadow-sm">
      {text}
    </div>
  );
}
