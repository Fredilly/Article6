import { ReactNode } from 'react';

export default function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white/10 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}
