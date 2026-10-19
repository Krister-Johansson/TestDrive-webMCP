import type { Car } from "@/db/schema";
import { ENUM_LABELS } from "./car-enums";
import { carName } from "./format";

/** Table columns the browse page can sort by. The values are what the URL carries in `sort`. */
export const CAR_SORT_KEYS = ["brand", "car", "year", "body", "powertrain", "gearbox", "drive", "seats", "towHitch", "color"] as const;

export type CarSortKey = (typeof CAR_SORT_KEYS)[number];
export type CarSort = { key: CarSortKey; order: "asc" | "desc" };

/** Columns whose values repeat across cars, so grouping by them makes sense. */
export const CAR_GROUP_KEYS = ["brand", "year", "body", "powertrain", "gearbox", "drive", "seats", "towHitch", "color"] as const;
export type CarGroupKey = (typeof CAR_GROUP_KEYS)[number];

/** URL params that describe how the table is arranged rather than which cars match. */
const TABLE_PARAMS = ["sort", "order", "group"] as const;

/** The value each column sorts by: what the table shows, so the order matches what people read. */
const SORT_VALUE: Record<CarSortKey, (car: Car) => string | number> = {
  brand: (car) => car.brand,
  car: carName,
  year: (car) => car.year,
  body: (car) => ENUM_LABELS.bodyType[car.bodyType],
  powertrain: (car) => ENUM_LABELS.powertrain[car.powertrain],
  gearbox: (car) => ENUM_LABELS.transmission[car.transmission],
  drive: (car) => car.drivetrain.toUpperCase(),
  seats: (car) => car.seats,
  towHitch: (car) => (car.towHitch ? 1 : 0),
  color: (car) => car.color,
};

function isSortKey(value: string | null): value is CarSortKey {
  return (CAR_SORT_KEYS as readonly (string | null)[]).includes(value);
}

export function parseCarSort(params: URLSearchParams): CarSort | null {
  const key = params.get("sort");
  if (!isSortKey(key)) return null;
  return { key, order: params.get("order") === "desc" ? "desc" : "asc" };
}

function compare(a: string | number, b: string | number): number {
  return typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
}

/** A sorted copy. Equal values fall back to the car name, so the order is stable between renders. */
export function sortCars(cars: Car[], sort: CarSort | null): Car[] {
  if (!sort) return cars;
  const value = SORT_VALUE[sort.key];
  const direction = sort.order === "desc" ? -1 : 1;
  return [...cars].sort((a, b) => direction * compare(value(a), value(b)) || compare(carName(a), carName(b)));
}

/** The query for a header link: a new column starts ascending, the sorted column flips. */
export function nextSortQuery(current: URLSearchParams, sort: CarSort | null, key: CarSortKey): string {
  const params = new URLSearchParams(current);
  const order = sort?.key === key && sort.order === "asc" ? "desc" : "asc";
  params.set("sort", key);
  params.set("order", order);
  return params.toString();
}

export function parseCarGroup(params: URLSearchParams): CarGroupKey | null {
  const key = params.get("group");
  return (CAR_GROUP_KEYS as readonly (string | null)[]).includes(key) ? (key as CarGroupKey) : null;
}

/** The query that groups by a column, or stops grouping when `key` is null. */
export function groupQuery(current: URLSearchParams, key: CarGroupKey | null): string {
  const params = new URLSearchParams(current);
  if (key) params.set("group", key);
  else params.delete("group");
  return params.toString();
}

/** Copies sort and grouping from the current URL onto a query built from filters, so filtering keeps the arrangement. */
export function keepTableParams(next: URLSearchParams, current: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(next);
  for (const name of TABLE_PARAMS) {
    const value = current.get(name);
    if (value !== null) params.set(name, value);
  }
  return params;
}
