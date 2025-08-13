import React from "react";
import Link from "next/link";
import RotatingPhrase from "@/components/RotatingPhrase";

export default function HeroSection() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video className="absolute inset-0 w-full h-full object-cover"
        src="https://ik.imagekit.io/tzublgy5d/Article6/hero480.mp4?updatedAt=1754588076486"
        autoPlay loop muted playsInline preload="metadata" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none" />
      <div className="relative h-full w-full flex items-center justify-center px-4">
        <div className="w-full max-w-3xl mx-auto">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8">
            <h1 className="text-white text-5xl md:text-6xl font-semibold tracking-tight drop-shadow-xl
                    flex flex-wrap items-baseline justify-center gap-x-2 text-balance w-full">
              <span>The carbon stack for</span>
              {/* Rotator sits on new line on mobile, inline from sm+ */}
              <span className="basis-full sm:basis-auto sm:ml-1">
                <RotatingPhrase
                  phrases={["climate teams", "state partners", "project developers"]}
                  mobileBlock
                  className="text-green-500"
                />
              </span>
            </h1>
            <p className="mt-4 text-white/90 text-base md:text-lg leading-relaxed text-center text-pretty">
              AI-powered MRV to measure, verify, and trade carbon under Article 6.2 / 6.4.
            </p>
            <div className="mt-6">
              <Link href="/contact#briefing" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-black bg-white/90 hover:bg-white transition">
                Book a Government Briefing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// QA checklist
// - Letters appear ~4/sec (calm).
// - Word remains ~3.4s, then ~0.8s empty, then ~1.2s before next word begins.
// - No layout shift; stays on one line at md+; glass card stable.
// - Dev (StrictMode) pacing matches production (single timer cleared each effect).

