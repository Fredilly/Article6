export default function StateFactsBody({ facts }: { facts?: string[] }) {
  if (!facts || facts.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
        Facts coming soon.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {facts.slice(0, 3).map((fact) => (
        <div key={fact} className="rounded-xl border p-4 text-sm leading-relaxed">
          {fact}
        </div>
      ))}
    </div>
  );
}
