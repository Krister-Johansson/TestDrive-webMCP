import { cookies } from "next/headers";
import { CarFiltersClient } from "@/components/booking/car-filters-client";
import { CarResults } from "@/components/booking/car-results";
import { HomePageTools } from "@/components/webmcp/home-tools";
import { parseCarFiltersLenient } from "@/lib/car-filters";
import { parseResultsView, RESULTS_VIEW_COOKIE } from "@/lib/results-view";
import { toSearchParams, type SearchParams } from "@/lib/search-params";
import { getBookingService } from "@/lib/service";

/** The car list with filters. */
export async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const params = toSearchParams(searchParams);
  const filters = parseCarFiltersLenient(params);
  const view = parseResultsView((await cookies()).get(RESULTS_VIEW_COOKIE)?.value);
  const service = getBookingService();
  const cars = service.findCars(filters);
  const options = service.filterOptions(filters);

  return (
    <main className="mx-auto max-w-6xl px-4">
      <HomePageTools />
      <CarFiltersClient
        title={<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Book a test drive</h1>}
        filters={filters}
        options={options}
        resultCount={cars.length}
        view={view}
      >
        <CarResults cars={cars} view={view} />
      </CarFiltersClient>
    </main>
  );
}
