"use client";

import React from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface GalleryCarouselProps {
  images: string[];
}

export default function GalleryCarousel({ images }: GalleryCarouselProps) {
  return (
    <div className="relative">
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((src, i) => (
            <CarouselItem key={i} className="basis-full">
              <div className="relative w-full h-64 md:h-80 lg:h-96">
                <Image
                  src={src}
                  alt={`State image ${i + 1}`}
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

