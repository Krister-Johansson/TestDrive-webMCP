"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition } from "react";
import { findCarAction, findCarsAction } from "@/lib/actions";
import { arrangeQuery, describeArrangement, type Arrangement } from "@/lib/arrange";
import { filtersToSearchParams, parseCarFiltersLenient, type CarFilters } from "@/lib/car-filters";
import { keepTableParams, parseCarGroup, parseCarSort } from "@/lib/car-sort";
import { parseResultsView, RESULTS_VIEW_COOKIE } from "@/lib/results-view";
import { HomeToolset } from "./home-toolset";

/** Wires the home page tools to the router and the server. */
export function HomePageTools() {
  const router = useRouter();
  const pathname = usePathname();

  async function applyFilters(filters: CarFilters) {
    const query = keepTableParams(filtersToSearchParams(filters), new URLSearchParams(window.location.search)).toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
    const result = await findCarsAction(filters);
    return result.ok ? result.data.length : 0;
  }

  async function openCar(query: string) {
    const result = await findCarAction(query);
    if (!result.ok || !result.data) throw new Error(`No car matches "${query}". Use find_cars to see the fleet.`);
    const car = result.data;
    startTransition(() => {
      router.push(`/book/${car.id}`);
    });
    return `Opened the booking page for ${car.brand} ${car.model} (id ${car.id}). Use list_available_slots to pick a time.`;
  }

  async function arrange(arrangement: Arrangement) {
    const current = new URLSearchParams(window.location.search);
    const params = arrangeQuery(current, arrangement);
    const savedView = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${RESULTS_VIEW_COOKIE}=`))
      ?.slice(RESULTS_VIEW_COOKIE.length + 1);
    const view = arrangement.view ?? parseResultsView(savedView);
    // Same cookie the view toggle writes; the server reads it to pick cards or table.
    document.cookie = `${RESULTS_VIEW_COOKIE}=${view}; path=/; max-age=31536000; samesite=lax`;
    const query = params.toString();
    startTransition(() => {
      if (query === current.toString()) router.refresh();
      else router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
    const result = await findCarsAction(parseCarFiltersLenient(params));
    const cars = result.ok ? result.data : [];
    return describeArrangement({ view, sort: parseCarSort(params), group: parseCarGroup(params) }, cars);
  }

  return <HomeToolset applyFilters={applyFilters} openCar={openCar} arrange={arrange} />;
}
