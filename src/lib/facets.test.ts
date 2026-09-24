import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/db";
import { seedDatabase } from "@/db/seed";
import { createBookingService, type BookingService } from "./booking-service";
import { createEventBus } from "./events";

describe("filterOptions", () => {
  let service: BookingService;
  beforeEach(() => {
    service = createBookingService(createTestDb(), createEventBus());
    seedDatabase(service, { days: 1 });
  });

  it("lists every value in stock with counts when nothing is filtered", () => {
    const options = service.filterOptions({});
    expect(options.brand).toEqual([
      { value: "Aldo", count: 2 },
      { value: "Kestrel", count: 3 },
      { value: "Norra", count: 3 },
    ]);
    expect(options.model).toEqual([]);
    expect(options.bodyType.map((f) => f.value)).toEqual(["suv", "sedan", "wagon", "hatchback", "coupe"]);
    expect(options.color.map((f) => f.value)).toContain("Red");
    expect(options.seats).toEqual([2, 4, 5, 7]);
    expect(options.years).toEqual([2023, 2024, 2025, 2026]);
    expect(options.towHitch).toBe(true);
  });

  it("narrows every other facet by the active filters and lists models for the chosen brand", () => {
    const options = service.filterOptions({ brand: "Kestrel" });
    expect(options.model.map((f) => f.value)).toEqual(["Heath", "Lane", "Moor"]);
    expect(options.bodyType.map((f) => f.value)).toEqual(["suv", "sedan", "wagon"]);
    expect(options.transmission.map((f) => f.value)).toEqual(["manual", "automatic"]);
    expect(options.seats).toEqual([5]);
  });

  it("keeps a facet's own values open so the selection can change", () => {
    const options = service.filterOptions({ brand: "Kestrel", bodyType: "hatchback" });
    expect(options.model).toEqual([]);
    expect(options.bodyType.map((f) => f.value)).toEqual(["suv", "sedan", "wagon"]);
    expect(options.brand.map((f) => f.value)).toEqual(["Aldo"]);
  });

  it("does not let the model filter hide other brands", () => {
    const options = service.filterOptions({ brand: "Norra", model: "Vik" });
    expect(options.brand.map((f) => f.value)).toEqual(["Aldo", "Kestrel", "Norra"]);
    expect(options.powertrain.map((f) => f.value)).toEqual(["plug-in-hybrid"]);
  });

  it("ignores inactive cars", () => {
    const sera = service.findCar("Aldo Sera")!;
    service.updateCar(sera.id, { active: false });
    expect(service.filterOptions({}).bodyType.map((f) => f.value)).not.toContain("coupe");
  });
});
