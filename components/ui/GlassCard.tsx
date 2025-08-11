import type { ReactNode } from 'react';

export default function GlassCard({children, className = ''}: {children: ReactNode; className?: string}) {
  return (
    <div className={`rounded-3xl border border-white/40 bg-white/10 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] ${className}`}>
      {children}
    </div>
  );
}

