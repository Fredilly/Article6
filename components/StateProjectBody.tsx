import GalleryCarousel from "@/components/GalleryCarousel";
import { StateInfo } from "@/data/states";

export default function StateProjectBody({ state }: { state: StateInfo }) {
  const images = state.images ?? [];
  return (
    <>
      {images.length > 0 && <GalleryCarousel images={images} />}

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">What we&apos;ve done so far</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
          {state.timeline.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {state.nextSteps && state.nextSteps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Next steps</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
            {state.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {state.docs && state.docs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Documents shared</h2>
          <div className="flex flex-wrap gap-2">
            {state.docs.map((doc) => (
              <a
                key={doc.href}
                href={doc.href}
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
    </>
  );
}
