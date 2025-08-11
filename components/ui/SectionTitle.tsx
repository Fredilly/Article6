export default function SectionTitle({kicker, title, subtitle}:{kicker?:string; title:string; subtitle?:string}) {
  return (
    <header className="mb-6">
      {kicker && <div className="text-xs uppercase tracking-widest text-gray-500">{kicker}</div>}
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-gray-600 max-w-prose">{subtitle}</p>}
    </header>
  );
}

