import Link from "next/link";
import { ViewTransition } from "react";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { Car } from "@/db/schema";
import { CarCard } from "./car-card";

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
