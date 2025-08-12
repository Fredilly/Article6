import React, { useEffect, useRef } from "react";
import Link from "next/link";
import RotatingPhrase from "@/components/RotatingPhrase";

const HERO_SRC = "https://ik.imagekit.io/tzublgy5d/Article6/hero480.mp4?updatedAt=1754588076486";
const HERO_SRC_1P5X = "https://ik.imagekit.io/tzublgy5d/Article6/hero480_1p5x.mp4";

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const setRate = () => {
      try {
        video.playbackRate = 1.5;
      } catch {
        // no-op
      }
    };
    video.addEventListener("loadedmetadata", setRate);
    video.addEventListener("play", setRate);
    setRate();
    return () => {
      video.removeEventListener("loadedmetadata", setRate);
      video.removeEventListener("play", setRate);
    };
  }, []);

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const src = isIOS ? HERO_SRC_1P5X : HERO_SRC;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none" />
      <div className="relative h-full w-full flex items-center justify-center px-4">
        <div className="w-full max-w-3xl mx-auto">
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 md:p-8">
            <h1 className="text-white text-3xl md:text-5xl font-semibold tracking-tight leading-tight inline-flex flex-nowrap items-baseline md:whitespace-nowrap">
              <span className="opacity-90">The carbon stack for&nbsp;</span>
              <RotatingPhrase
                phrases={["governments", "treasuries", "climate teams"]}
                className="text-green-400 align-baseline"
                // tuned for human-readable speed
                typeSpeedMs={100}
                deleteSpeedMs={60}
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
