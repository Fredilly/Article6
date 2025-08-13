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
            <h1 className="text-white text-3xl md:text-5xl font-semibold tracking-tight leading-tight inline-flex flex-nowrap items-baseline md:whitespace-nowrap">
              <span className="opacity-90">The carbon stack for&nbsp;</span>
              <RotatingPhrase
                phrases={["governments", "treasuries", "climate teams"]}
                className="text-green-400 align-baseline"
                // explicit faster values
                typeSpeedMs={110}
                deleteSpeedMs={70}
                holdMs={3200}
                preTypeDelayMs={1200}
                postDeleteDelayMs={800}
                reducedMotionFallback="governments"
              />
            </h1>
            <p className="mt-4 text-white/90 text-base md:text-lg leading-relaxed">
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
