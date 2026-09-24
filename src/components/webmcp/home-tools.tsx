"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition } from "react";
import { findCarAction, findCarsAction } from "@/lib/actions";
import { filtersToSearchParams, type CarFilters } from "@/lib/car-filters";
import { HomeToolset } from "./home-toolset";

/** Wires the home page tools to the router and the server. */
export function HomePageTools() {
  const router = useRouter();
  const pathname = usePathname();

  async function applyFilters(filters: CarFilters) {
    const query = filtersToSearchParams(filters).toString();
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

  return <HomeToolset applyFilters={applyFilters} openCar={openCar} />;
}
