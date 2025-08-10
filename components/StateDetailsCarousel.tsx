"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import StateDetailsCard from "@/components/StateDetailsCard";

export default function StateDetailsCarousel({ states, startIndex = 0 }: { states: string[]; startIndex?: number }) {
  return (
    <div className="relative px-2 md:px-4 [padding-bottom:env(safe-area-inset-bottom)]">
      <Carousel className="w-full" opts={{ startIndex }}>
        <CarouselContent className="min-h-[28rem] md:min-h-[32rem]">
          {states.map((slug) => (
            <CarouselItem key={slug} className="basis-full pointer-events-auto">
              <StateDetailsCard slug={slug} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 md:h-12 md:w-12 rounded-full shadow-sm bg-white/90 backdrop-blur border hover:bg-white"
          aria-label="Previous state"
        />
        <CarouselNext
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 md:h-12 md:w-12 rounded-full shadow-sm bg-white/90 backdrop-blur border hover:bg-white"
          aria-label="Next state"
        />
      </Carousel>
    </div>
  );
}

