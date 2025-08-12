import React from "react";
import Link from "next/link";

const HeroSection: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* KEEP existing video element exactly (src/attrs unchanged) */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://ik.imagekit.io/tzublgy5d/Article6/hero480.mp4?updatedAt=1754588076486"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />
      {/* subtle gradient to improve contrast behind the glass card */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none" />

      <div className="relative h-full w-full flex items-center justify-center px-4">
        <div className="w-full max-w-3xl mx-auto">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8">
            <h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight">
              Operationalizing <span className="text-green-500">Article&nbsp;6</span> for Nigerian States
            </h1>

            <p className="mt-4 text-white/90 text-base md:text-lg leading-relaxed">
              MRV-AI and turnkey execution—from LOS → MOU → <span className="font-semibold">FERA</span>—to unlock climate finance under Articles 6.2, 6.4, and 6.8.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact#briefing"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-black bg-white/90 hover:bg-white transition"
                aria-label="Book a 20-minute Government Briefing"
              >
                Book a 20-min Government Briefing
              </Link>
              <Link
                href="/mrv-ai#waitlist"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white/90 border border-white/30 hover:bg-white/10 transition"
                aria-label="Join the MRV-AI Waitlist"
              >
                Join the MRV-AI Waitlist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HeroSection;
