import { describe, expect, it } from "vitest";
import { createTestDb } from "@/db";
import { createBookingService } from "@/lib/booking-service";
import { createEventBus } from "@/lib/events";
import { SEED_CARS, seedDatabase } from "./seed";

describe("seedDatabase", () => {
  it("creates every seed car with slots for the coming days", () => {
    const service = createBookingService(createTestDb(), createEventBus());
    const result = seedDatabase(service, { days: 2, startHour: 9, endHour: 12 });
    expect(result.cars).toBe(SEED_CARS.length);
    expect(result.slots).toBe(SEED_CARS.length * 2 * 4);
    expect(service.findCars({})).toHaveLength(SEED_CARS.length);
  });

  it("skips when cars already exist unless reset is requested", () => {
    const service = createBookingService(createTestDb(), createEventBus());
    seedDatabase(service, { days: 1 });
    expect(seedDatabase(service, { days: 1 }).skipped).toBe(true);
    const reseeded = seedDatabase(service, { days: 1, reset: true });
    expect(reseeded.skipped).toBe(false);
    expect(service.findCars({})).toHaveLength(SEED_CARS.length);
    expect(service.findCars({}, { includeInactive: true })).toHaveLength(SEED_CARS.length);
  });

  it("gives every filter at least one hit and one miss", () => {
    const service = createBookingService(createTestDb(), createEventBus());
    seedDatabase(service, { days: 1 });
    const all = service.findCars({}).length;
    for (const filters of [
      { powertrain: "electric" as const },
      { transmission: "manual" as const },
      { towHitch: true },
      { bodyType: "coupe" as const },
      { drivetrain: "rwd" as const },
      { minSeats: 7 },
      { feature: "panoramic" },
    ]) {
      const hits = service.findCars(filters).length;
      expect(hits, JSON.stringify(filters)).toBeGreaterThan(0);
      expect(hits, JSON.stringify(filters)).toBeLessThan(all);
    }
  });
});
