interface Doc {
  label: string;
  url: string;
}

interface StateBodyProjectProps {
  doneSoFar: string[];
  nextSteps: string[];
  docs?: Doc[];
}

export default function StateBodyProject({
  doneSoFar,
  nextSteps,
  docs,
}: StateBodyProjectProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">What we&apos;ve done so far</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
          {doneSoFar.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {nextSteps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Next steps</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
            {nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {docs && docs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Documents shared</h2>
          <div className="flex flex-wrap gap-2">
            {docs.map((doc) => (
              <a
                key={doc.url}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 border rounded-full text-sm"
              >
                {doc.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

