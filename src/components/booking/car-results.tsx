"use client";

import { useSyncExternalStore } from "react";
import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Car } from "@/db/schema";
import { CarGrid } from "./car-grid";
import { CarTable } from "./car-table";

export type ResultsView = "cards" | "table";
export const RESULTS_VIEW_KEY = "testdrive.results.view";

const listeners = new Set<() => void>();
function readView(): ResultsView {
  try {
    return localStorage.getItem(RESULTS_VIEW_KEY) === "table" ? "table" : "cards";
  } catch {
    return "cards";
  }
}
function writeView(view: ResultsView) {
  try {
    localStorage.setItem(RESULTS_VIEW_KEY, view);
  } catch {
    // ignore
  }
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useResultsView(): [ResultsView, (view: ResultsView) => void] {
  const view = useSyncExternalStore(subscribe, readView, () => "cards" as const);
  return [view, writeView];
}

/** Cards or table toggle for the results toolbar. */
export function ResultsViewToggle() {
  const [view, setView] = useResultsView();
  return (
    <ToggleGroup
      aria-label="View"
      variant="outline"
      size="sm"
      value={[view]}
      onValueChange={(value) => value[0] && setView(value[0] as ResultsView)}
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

export function CarResults({ cars, query = "" }: { cars: Car[]; query?: string }) {
  const [view] = useResultsView();
  if (cars.length === 0 || view === "cards") return <CarGrid cars={cars} query={query} />;
  return <CarTable cars={cars} query={query} />;
}
