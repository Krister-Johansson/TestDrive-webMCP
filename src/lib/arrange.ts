import type { Car } from "@/db/schema";
import {
  CAR_COLUMN_LABELS,
  CAR_GROUP_KEYS,
  CAR_SORT_KEYS,
  carColumnValue,
  type CarGroupKey,
  type CarSort,
  type CarSortKey,
} from "./car-sort";
import type { ResultsView } from "./results-view";

/** What arrange_cars changes. A missing key keeps the current setting; null clears it. */
export type Arrangement = {
  view?: ResultsView;
  sort?: CarSort | null;
  group?: CarGroupKey | null;
};

const VIEWS = ["cards", "table"] as const;
const ORDERS = ["asc", "desc"] as const;

function pick<T extends string>(input: Record<string, unknown>, name: string, allowed: readonly T[]): T | undefined {
  const value = input[name];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`${name} must be one of: ${allowed.join(", ")}.`);
}

/** Validates tool input. Errors name the valid values so the agent can retry. */
export function parseArrangement(input: Record<string, unknown>): Arrangement {
  const view = pick(input, "view", VIEWS);
  const sortBy = pick(input, "sortBy", [...CAR_SORT_KEYS, "none"] as const);
  const order = pick(input, "order", ORDERS);
  const groupBy = pick(input, "groupBy", [...CAR_GROUP_KEYS, "none"] as const);

  const arrangement: Arrangement = {};
  if (view) arrangement.view = view;
  if (sortBy) arrangement.sort = sortBy === "none" ? null : { key: sortBy as CarSortKey, order: order ?? "asc" };
  if (groupBy) {
    if (groupBy !== "none" && view === "cards") throw new Error("Groups only show in the table view. Use view table, or leave view out.");
    arrangement.group = groupBy === "none" ? null : (groupBy as CarGroupKey);
    if (groupBy !== "none") arrangement.view = "table";
  }
  return arrangement;
}

/** The browse page query after the change. Filters and anything not mentioned stay as they are. */
export function arrangeQuery(current: URLSearchParams, arrangement: Arrangement): URLSearchParams {
  const params = new URLSearchParams(current);
  if (arrangement.sort !== undefined) {
    params.delete("sort");
    params.delete("order");
    if (arrangement.sort) {
      params.set("sort", arrangement.sort.key);
      params.set("order", arrangement.sort.order);
    }
  }
  if (arrangement.group !== undefined) {
    params.delete("group");
    if (arrangement.group) params.set("group", arrangement.group);
  }
  return params;
}

/** One line for the agent describing what the page shows now. */
export function describeArrangement(state: Required<Arrangement>, cars: Car[]): string {
  const count = `${cars.length} car${cars.length === 1 ? "" : "s"}`;
  const parts = [`Showing ${count} as ${state.view === "table" ? "a table" : "cards"}`];
  parts.push(
    state.sort
      ? `sorted by ${CAR_COLUMN_LABELS[state.sort.key].toLowerCase()} (${state.sort.order === "desc" ? "descending" : "ascending"})`
      : "in the default order",
  );
  if (state.group && state.view === "table") {
    const groups = new Set(cars.map((car) => carColumnValue(car, state.group as CarGroupKey))).size;
    parts.push(`grouped by ${CAR_COLUMN_LABELS[state.group].toLowerCase()} into ${groups} group${groups === 1 ? "" : "s"}`);
  }
  return `${parts.join(", ")}.`;
}
