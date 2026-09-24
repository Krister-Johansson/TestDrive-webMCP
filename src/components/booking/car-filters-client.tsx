"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition, useOptimistic, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { countActiveFilters, filtersToSearchParams, type CarFilters } from "@/lib/car-filters";
import type { FacetOptions } from "@/lib/booking-service";
import { ResultsViewToggle, type ResultsView } from "./car-results";
import { FilterPanel, FilterPanelHeading, FilterProvider, FilterSummary, useFilters } from "./filter-bar";

/** The filter button and sheet shown below lg. */
function MobileFilters() {
  const {
    state: { filters },
  } = useFilters();
  const active = countActiveFilters(filters);
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" className="lg:hidden" />}>
        <SlidersHorizontal aria-hidden="true" />
        Filters
        {active > 0 ? <Badge variant="secondary">{active}</Badge> : null}
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Only values in stock are shown.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <FilterPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * The browse frame. On wide screens it fills the viewport below the header: a toolbar row
 * (title, count, chips, view toggle), then the filter sidebar and the results. The sidebar
 * never scrolls: if it is taller than the window the page grows to fit it, and the results
 * column always matches that height and scrolls inside it. Below lg the filters live in a
 * sheet and the page scrolls normally.
 */
export function CarFiltersClient({
  title,
  filters,
  options,
  resultCount,
  view,
  children,
}: {
  title: ReactNode;
  filters: CarFilters;
  options: FacetOptions;
  resultCount: number;
  view: ResultsView;
  /** The car grid or table. */
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [optimistic, setOptimistic] = useOptimistic(filters);

  function change(next: CarFilters) {
    startTransition(() => {
      setOptimistic(next);
      const query = filtersToSearchParams(next).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <FilterProvider value={{ state: { filters: optimistic, options, resultCount }, actions: { change } }}>
      <div className="flex flex-col gap-5 lg:min-h-[calc(100dvh-3.5rem-1px)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-6">
          {title}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <MobileFilters />
            <FilterSummary />
            <ResultsViewToggle view={view} />
          </div>
        </div>
        <div className="flex flex-1 items-stretch gap-6 pb-6">
          <aside className="hidden w-[17rem] shrink-0 lg:block">
            <div className="rounded-xl border bg-card p-5">
              <FilterPanelHeading />
              <FilterPanel />
            </div>
          </aside>
          {/* The results column takes the row's height (the sidebar's, or the window's) without adding to it. */}
          <div className="min-w-0 flex-1 lg:relative">
            {/* Base UI sets position: relative inline on the ScrollArea root, so the absolute box is a wrapper. */}
            <div className="lg:absolute lg:inset-0">
              <ScrollArea className="h-full lg:-mr-3 lg:pr-3">
                {/* relative: absolutely positioned descendants (sr-only labels) must stay inside the viewport's clip */}
                <div className="@container relative min-w-0 lg:pr-1">{children}</div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </FilterProvider>
  );
}
