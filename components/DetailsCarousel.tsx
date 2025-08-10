"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function DetailsCarousel({
  overview,
  progress,
  nextSteps,
  contacts,
}: {
  overview: React.ReactNode;
  progress: React.ReactNode;
  nextSteps: React.ReactNode;
  contacts: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <Carousel className="w-full">
        <CarouselContent>
          <CarouselItem className="basis-full p-6">{overview}</CarouselItem>
          <CarouselItem className="basis-full p-6">{progress}</CarouselItem>
          <CarouselItem className="basis-full p-6">{nextSteps}</CarouselItem>
          <CarouselItem className="basis-full p-6">{contacts}</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

