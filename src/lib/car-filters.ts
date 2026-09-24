import * as z from "zod";
import { BODY_TYPES, COLOR_NAMES, DRIVETRAINS, POWERTRAINS, TRANSMISSIONS } from "./car-enums";

const trimmed = z.string().trim().min(1);
const boolLike = z.union([
  z.boolean(),
  z.enum(["true", "false"]).transform((value) => value === "true"),
]);
const intLike = z.coerce.number().int();

export const carFilterShape = {
  brand: trimmed.optional(),
  model: trimmed.optional(),
  bodyType: z.enum(BODY_TYPES).optional(),
  powertrain: z.enum(POWERTRAINS).optional(),
  transmission: z.enum(TRANSMISSIONS).optional(),
  drivetrain: z.enum(DRIVETRAINS).optional(),
  color: z.enum(COLOR_NAMES).optional(),
  minSeats: intLike.min(1).max(12).optional(),
  towHitch: boolLike.optional(),
  yearFrom: intLike.min(1990).max(2100).optional(),
  yearTo: intLike.min(1990).max(2100).optional(),
  feature: trimmed.optional(),
};

const objectSchema = z.object(carFilterShape);

export const carFilterSchema = objectSchema.refine(
  (value) => value.yearFrom === undefined || value.yearTo === undefined || value.yearFrom <= value.yearTo,
  { message: "yearFrom must not be after yearTo", path: ["yearFrom"] },
);

export type CarFilters = z.infer<typeof carFilterSchema>;
export const CAR_FILTER_KEYS = Object.keys(carFilterShape) as (keyof CarFilters)[];

export class CarFilterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CarFilterError";
  }
}

type FilterInput = URLSearchParams | Record<string, unknown>;

function toRecord(input: FilterInput): Record<string, unknown> {
  const entries = input instanceof URLSearchParams ? [...input.entries()] : Object.entries(input);
  const record: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    record[key] = value;
  }
  return record;
}

export function parseCarFilters(input: FilterInput): CarFilters {
  const result = carFilterSchema.safeParse(toRecord(input));
  if (!result.success) {
    throw new CarFilterError(z.prettifyError(result.error));
  }
  return stripUndefined(result.data);
}

export function parseCarFiltersLenient(input: FilterInput): CarFilters {
  const record = toRecord(input);
  const filters: Record<string, unknown> = {};
  for (const key of CAR_FILTER_KEYS) {
    if (!(key in record)) continue;
    const parsed = carFilterShape[key].safeParse(record[key]);
    if (parsed.success && parsed.data !== undefined) {
      filters[key] = parsed.data;
    }
  }
  if (
    typeof filters.yearFrom === "number" &&
    typeof filters.yearTo === "number" &&
    filters.yearFrom > filters.yearTo
  ) {
    delete filters.yearTo;
  }
  return filters as CarFilters;
}

export function filtersToSearchParams(filters: CarFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of CAR_FILTER_KEYS) {
    const value = filters[key];
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  return params;
}

export function hasActiveFilters(filters: CarFilters): boolean {
  return CAR_FILTER_KEYS.some((key) => filters[key] !== undefined);
}

export function countActiveFilters(filters: CarFilters): number {
  return CAR_FILTER_KEYS.filter((key) => filters[key] !== undefined).length;
}

function stripUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}
