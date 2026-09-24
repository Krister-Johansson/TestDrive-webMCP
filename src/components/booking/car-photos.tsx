"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { Car, CarImage } from "@/db/schema";
import { carName } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image-src";
import { cn } from "@/lib/utils";
import { CarPlaceholder } from "./car-placeholder";

/** Tracks which slide the carousel is on and lets the dots jump to one. */
function useCurrentSlide(): { current: number; setApi: (api: CarouselApi) => void; scrollTo: (index: number) => void } {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!api) return;
    // The initial snap is 0, so only event-driven updates set state here.
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);
  return { current, setApi, scrollTo: (index) => api?.scrollTo(index) };
}

type SlideProps = { car: Car; image: CarImage; index: number; sizes: string; priority?: boolean; className?: string; children?: ReactNode };

function Slide({ car, image, index, sizes, priority, className, children }: SlideProps) {
  return (
    <CarouselItem className="relative aspect-[16/10] pl-0">
      <Image
        src={image.url}
        alt={`${carName(car)}, photo ${index + 1} of ${car.images.length}`}
        fill
        sizes={sizes}
        unoptimized={!isOptimizableImage(image.url)}
        priority={priority}
        className={cn("object-cover", className)}
      />
      {children}
    </CarouselItem>
  );
}

function Dots({ car, current, onPick, small }: { car: Car; current: number; onPick: (index: number) => void; small?: boolean }) {
  return (
    <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5" role="tablist" aria-label="Photos">
      {car.images.map((image, index) => (
        <button
          key={image.id}
          type="button"
          role="tab"
          aria-selected={index === current}
          aria-label={`Photo ${index + 1}`}
          onClick={() => onPick(index)}
          className={cn(
            "rounded-full ring-1 ring-black/30 transition-all",
            small ? "size-1.5" : "size-2",
            index === current ? cn("bg-white", small ? "w-4" : "w-5") : "bg-white/60 hover:bg-white/90",
          )}
        />
      ))}
    </div>
  );
}

const ARROW = "opacity-0 transition-opacity group-hover/photos:opacity-100 focus-visible:opacity-100";

/** Compact carousel for a list card. Each photo also links to the car; the card body carries the accessible link. */
export function CarPhotoCard({ car, href }: { car: Car; href: string }) {
  const { current, setApi, scrollTo } = useCurrentSlide();
  if (car.images.length === 0) {
    return (
      <div className="aspect-[16/10] overflow-hidden rounded-t-xl">
        <CarPlaceholder car={car} />
      </div>
    );
  }
  const many = car.images.length > 1;
  return (
    <Carousel setApi={setApi} opts={{ loop: many }} className="group/photos relative overflow-hidden rounded-t-xl">
      <CarouselContent className="ml-0">
        {car.images.map((image, index) => (
          <Slide
            key={image.id}
            car={car}
            image={image}
            index={index}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="transition-transform duration-500 ease-out group-hover/card:scale-[1.04]"
          >
            <Link href={href} scroll={false} aria-hidden="true" tabIndex={-1} className="absolute inset-0" />
          </Slide>
        ))}
      </CarouselContent>
      {many ? (
        <>
          <CarouselPrevious className={cn("left-2 size-7", ARROW)} />
          <CarouselNext className={cn("right-2 size-7", ARROW)} />
          <Dots car={car} current={current} onPick={scrollTo} small />
        </>
      ) : null}
    </Carousel>
  );
}

/** Full carousel for the detail view, with the photographer credit under it. */
export function CarPhotoDetail({ car }: { car: Car }) {
  const { current, setApi, scrollTo } = useCurrentSlide();
  if (car.images.length === 0) {
    return (
      <div className="aspect-[16/10] overflow-hidden rounded-2xl">
        <CarPlaceholder car={car} />
      </div>
    );
  }
  const many = car.images.length > 1;
  const credit = car.images[current]?.credit;
  const source = car.images[current]?.sourceUrl;
  return (
    <figure className="space-y-2">
      <Carousel setApi={setApi} opts={{ loop: many }} className="group/photos relative overflow-hidden rounded-2xl">
        <CarouselContent className="ml-0">
          {car.images.map((image, index) => (
            <Slide key={image.id} car={car} image={image} index={index} sizes="(min-width: 1024px) 40vw, 100vw" priority={index === 0} />
          ))}
        </CarouselContent>
        {many ? (
          <>
            <CarouselPrevious className={cn("left-2", ARROW)} />
            <CarouselNext className={cn("right-2", ARROW)} />
            <Dots car={car} current={current} onPick={scrollTo} />
          </>
        ) : null}
      </Carousel>
      {credit ? (
        <figcaption className="truncate text-[11px] text-muted-foreground">
          {source ? (
            <a href={source} target="_blank" rel="noreferrer" className="hover:underline">
              {credit}
            </a>
          ) : (
            credit
          )}
        </figcaption>
      ) : null}
    </figure>
  );
}
