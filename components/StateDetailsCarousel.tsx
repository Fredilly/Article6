"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import StateDetailsCard from "@/components/StateDetailsCard";

export default function StateDetailsCarousel({ states, startIndex = 0 }: { states: string[]; startIndex?: number }) {
  return (
    <Carousel className="w-full" opts={{ startIndex }}>
      <CarouselContent>
        {states.map((slug) => (
          <CarouselItem key={slug} className="basis-full">
            <StateDetailsCard slug={slug} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="md:top-1/2 md:-translate-y-1/2 top-auto bottom-2 translate-y-0" />
      <CarouselNext className="md:top-1/2 md:-translate-y-1/2 top-auto bottom-2 translate-y-0" />
    </Carousel>
  );
}

