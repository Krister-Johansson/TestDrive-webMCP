import { SEED_CARS } from "@/db/seed";
import type { Car } from "@/db/schema";
import { colorHex } from "@/lib/car-enums";

/** A fully populated car view for component tests, based on a seed car. */
export function makeCar(overrides: Partial<Car> = {}, seedIndex = 0): Car {
  const seed = SEED_CARS[seedIndex];
  const base: Car = {
    id: `car${seedIndex + 1}`,
    modelId: `model${seedIndex + 1}`,
    brandId: `brand-${seed.brand.toLowerCase()}`,
    brand: seed.brand,
    model: seed.model,
    year: seed.year,
    bodyType: seed.bodyType,
    powertrain: seed.powertrain,
    transmission: seed.transmission,
    drivetrain: seed.drivetrain,
    color: seed.color,
    colorHex: colorHex(seed.color),
    seats: seed.seats,
    towHitch: seed.towHitch,
    features: seed.features ?? [],
    tagline: seed.tagline ?? "",
    active: true,
    createdAt: 0,
    images: [],
  };
  return { ...base, ...overrides };
}
