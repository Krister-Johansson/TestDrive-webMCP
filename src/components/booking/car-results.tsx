"use client";

import { useRouter } from "next/navigation";
import { startTransition, ViewTransition } from "react";
import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Car } from "@/db/schema";
import { RESULTS_VIEW_COOKIE, type ResultsView } from "@/lib/results-view";
import { CarGrid } from "./car-grid";
import { CarTable } from "./car-table";

export type { ResultsView };

/**
 * Cards or table. The choice is a cookie read on the server, so the first paint already
 * shows the right layout; changing it refreshes the page inside a transition.
 */
export function ResultsViewToggle({ view }: { view: ResultsView }) {
  const router = useRouter();
  return (
    <ToggleGroup
      aria-label="View"
      variant="outline"
      size="sm"
      value={[view]}
      onValueChange={(value) => {
        const next = value[0] as ResultsView | undefined;
        if (!next || next === view) return;
        document.cookie = `${RESULTS_VIEW_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        startTransition(() => router.refresh());
      }}
    >
      <ToggleGroupItem value="cards" aria-label="Cards">
        <LayoutGrid aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table">
        <List aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export function CarResults({ cars, view, query = "" }: { cars: Car[]; view: ResultsView; query?: string }) {
  return (
    <ViewTransition>
      {cars.length === 0 || view === "cards" ? <CarGrid cars={cars} query={query} /> : <CarTable cars={cars} query={query} />}
    </ViewTransition>
  );
}
