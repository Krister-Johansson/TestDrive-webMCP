import Link from "next/link";
import { ViewTransition } from "react";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Car } from "@/db/schema";
import { CarCard } from "./car-card";

/**
 * Placeholder while the filtered list streams in. Deliberately without ViewTransition
 * names: sharing them with the real cards makes React morph every card from the
 * fallback layout to the final one, which looks like the images flying in on load.
 */
export function CarGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CarGrid({ cars, query = "" }: { cars: Car[]; query?: string }) {
  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
        <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">No cars match these filters.</p>
        <p className="text-sm text-muted-foreground">Loosen a filter or clear them all to see the whole fleet.</p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Clear filters
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-3" aria-label="Cars">
      {cars.map((car) => (
        <ViewTransition key={car.id} default="card">
          <li>
            <CarCard car={car} query={query} />
          </li>
        </ViewTransition>
      ))}
    </ul>
  );
}
