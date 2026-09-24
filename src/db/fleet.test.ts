import { describe, expect, it } from "vitest";
import { createTestDb } from "@/db";
import { createBookingService } from "@/lib/booking-service";
import { createEventBus } from "@/lib/events";
import { DEMO_CARS } from "./fleet";
import { seedDatabase } from "./seed";

describe("demo fleet", () => {
  it("has five brands with five models each and seeds cleanly", () => {
    const byBrand = new Map<string, string[]>();
    for (const car of DEMO_CARS) byBrand.set(car.brand, [...(byBrand.get(car.brand) ?? []), car.model]);
    expect([...byBrand.keys()]).toEqual(["Volvo", "Polestar", "BMW", "Audi", "Toyota"]);
    for (const models of byBrand.values()) {
      expect(models).toHaveLength(5);
      expect(new Set(models).size).toBe(5);
    }
    const service = createBookingService(createTestDb(), createEventBus());
    const result = seedDatabase(service, { cars: DEMO_CARS, days: 1 });
    expect(result.cars).toBe(25);
    expect(service.listBrands().map((b) => b.models.length)).toEqual([5, 5, 5, 5, 5]);
  });

  it("gives every filter something to find", () => {
    const service = createBookingService(createTestDb(), createEventBus());
    seedDatabase(service, { cars: DEMO_CARS, days: 1 });
    expect(service.findCars({ transmission: "manual" }).length).toBeGreaterThanOrEqual(3);
    expect(service.findCars({ bodyType: "coupe" }).length).toBeGreaterThanOrEqual(2);
    expect(service.findCars({ powertrain: "diesel" }).length).toBeGreaterThanOrEqual(1);
    expect(service.findCars({ minSeats: 7 }).length).toBeGreaterThanOrEqual(2);
  });
});
