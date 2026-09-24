import { Suspense } from "react";
import { CarFiltersClient } from "@/components/booking/car-filters-client";
import { CarGridSkeleton } from "@/components/booking/car-grid";
import { CarResults } from "@/components/booking/car-results";
import { HomePageTools } from "@/components/webmcp/home-tools";
import { parseCarFiltersLenient } from "@/lib/car-filters";
import { toSearchParams, type SearchParams } from "@/lib/search-params";
import { getBookingService } from "@/lib/service";

/** The car list with filters. */
export function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const params = toSearchParams(searchParams);
  const filters = parseCarFiltersLenient(params);
  const service = getBookingService();
  const cars = service.findCars(filters);
  const options = service.filterOptions(filters);

  return (
    <main className="mx-auto max-w-6xl px-4">
      <Suspense fallback={<CarGridSkeleton count={Math.min(cars.length, 6)} />}>
        <HomePageTools />
        <CarFiltersClient
          title={<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Book a test drive</h1>}
          filters={filters}
          options={options}
          resultCount={cars.length}
        >
          <CarResults cars={cars} />
        </CarFiltersClient>
      </Suspense>
    </main>
  );
}
