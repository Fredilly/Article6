"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface StateCarouselProps {
  images?: string[];
}

export default function StateCarousel({ images }: StateCarouselProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="relative">
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((src, i) => (
            <CarouselItem key={i} className="basis-full">
              <div className="relative w-full h-64 md:h-80 lg:h-96">
                <Image
                  src={src}
                  alt={`Image ${i + 1}`}
                  className="object-cover rounded-2xl border bg-muted"
                  fill
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

