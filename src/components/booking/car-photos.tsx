"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { Car } from "@/db/schema";
import { carName } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image-src";
import { cn } from "@/lib/utils";
import { CarPlaceholder } from "./car-placeholder";

function Placeholder({ car, className }: { car: Car; className?: string }) {
  return (
    <div className={cn("aspect-[16/10] overflow-hidden", className)}>
      <CarPlaceholder car={car} />
    </div>
  );
}

export type CarPhotosProps = {
  car: Car;
  /** "card" is compact: small controls, no caption, and each photo links to `href`. */
  variant?: "card" | "detail";
  href?: string;
  className?: string;
};

/** A car's photos as a carousel with dots. Falls back to the generated placeholder when there are none. */
export function CarPhotos({ car, variant = "detail", href, className }: CarPhotosProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const card = variant === "card";

  useEffect(() => {
    if (!api) return;
    // The initial snap is 0, so only event-driven updates set state here.
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (car.images.length === 0) {
    return <Placeholder car={car} className={cn(card ? "rounded-t-xl" : "rounded-2xl", className)} />;
  }
  const credit = car.images[current]?.credit;
  const source = car.images[current]?.sourceUrl;
  const sizes = card ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 40vw, 100vw";
  const many = car.images.length > 1;

  return (
    <figure className={cn(!card && "space-y-2", className)}>
      <Carousel
        setApi={setApi}
        opts={{ loop: many }}
        className={cn("group/photos relative overflow-hidden", card ? "rounded-t-xl" : "rounded-2xl")}
      >
        <CarouselContent className="ml-0">
          {car.images.map((image, index) => (
            <CarouselItem key={image.id} className="relative aspect-[16/10] pl-0">
              <Image
                src={image.url}
                alt={`${carName(car)}, photo ${index + 1} of ${car.images.length}`}
                fill
                sizes={sizes}
                unoptimized={!isOptimizableImage(image.url)}
                priority={!card && index === 0}
                className={cn("object-cover", card && "transition-transform duration-500 ease-out group-hover/card:scale-[1.04]")}
              />
              {href ? (
                // A second way to open the car; the card body carries the accessible link.
                <Link href={href} scroll={false} aria-hidden="true" tabIndex={-1} className="absolute inset-0" />
              ) : null}
            </CarouselItem>
          ))}
        </CarouselContent>
        {many ? (
          <>
            <CarouselPrevious
              className={cn("left-2 opacity-0 transition-opacity group-hover/photos:opacity-100 focus-visible:opacity-100", card && "size-7")}
            />
            <CarouselNext
              className={cn("right-2 opacity-0 transition-opacity group-hover/photos:opacity-100 focus-visible:opacity-100", card && "size-7")}
            />
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5" role="tablist" aria-label="Photos">
              {car.images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  role="tab"
                  aria-selected={index === current}
                  aria-label={`Photo ${index + 1}`}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "rounded-full ring-1 ring-black/30 transition-all",
                    card ? "size-1.5" : "size-2",
                    index === current ? cn("bg-white", card ? "w-4" : "w-5") : "bg-white/60 hover:bg-white/90",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </Carousel>
      {!card && credit ? (
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
