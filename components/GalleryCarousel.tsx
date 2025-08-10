"use client";

import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface GalleryCarouselProps {
  images: { src: string; alt: string }[];
}

export default function GalleryCarousel({ images }: GalleryCarouselProps) {
  return (
    <div className="relative">
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((img, i) => (
            <CarouselItem key={i} className="basis-full">
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-2xl border bg-muted"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

