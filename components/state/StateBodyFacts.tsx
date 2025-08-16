interface StateBodyFactsProps {
  stateName: string;
  facts?: string[];
}

export default function StateBodyFacts({ stateName, facts }: StateBodyFactsProps) {
  if (!facts || facts.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center space-y-2">
        <h2 className="text-xl font-semibold">Coming soon</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;re preparing verified facts for {stateName}. Talk to our team meanwhile.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {facts.map((fact, i) => (
        <div
          key={i}
          className="rounded-xl border bg-white/60 backdrop-blur p-4 shadow-sm"
        >
          <p className="text-sm leading-relaxed">{fact}</p>
        </div>
      ))}
    </div>
  );
}

