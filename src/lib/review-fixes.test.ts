import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "@/db";
import { SEED_CARS, seedDatabase } from "@/db/seed";
import { BookingStateError, ValidationError, createBookingService, type BookingService } from "./booking-service";
import { loadBookingView } from "./booking-view";
import { createEventBus } from "./events";

describe("review fixes", () => {
  let service: BookingService;
  let now: number;
  beforeEach(() => {
    now = new Date(2026, 9, 1, 12, 0).getTime();
    service = createBookingService(createTestDb(), createEventBus(), { now: () => now });
    seedDatabase(service, { days: 2, startHour: 9, endHour: 17, today: new Date(now) });
  });

  it("rejects a zero or negative slot duration instead of looping", () => {
    const car = service.findCars({})[0];
    for (const durationMinutes of [0, -5, 4.5]) {
      expect(() =>
        service.generateSlots({ carId: car.id, from: "2026-10-05", to: "2026-10-05", startHour: 9, endHour: 10, durationMinutes }),
      ).toThrow(ValidationError);
    }
  });

  it("caps the slot date range", () => {
    const car = service.findCars({})[0];
    expect(() =>
      service.generateSlots({ carId: car.id, from: "2026-01-01", to: "2028-01-01", startHour: 9, endHour: 10 }),
    ).toThrow(/366/);
  });

  it("hides inactive cars from lookups and refuses bookings on them", () => {
    const car = service.findCar("Norra Fjell")!;
    const slot = service.listAvailableSlots({ carId: car.id, date: "2026-10-02" })[0];
    service.updateCar(car.id, { active: false });
    expect(service.findCar("Norra Fjell")).toBeNull();
    expect(service.findCar(car.id)).toBeNull();
    expect(service.findCar(car.id, { includeInactive: true })?.id).toBe(car.id);
    expect(() => service.createBooking({ slotId: slot.id, customerName: "Ada" })).toThrow(BookingStateError);
  });

  it("treats slots that already started as unavailable", () => {
    const car = service.findCar("Norra Fjell")!;
    const today = service.listSlots({ carId: car.id, date: "2026-10-01" });
    const past = today.filter((slot) => slot.past);
    const future = today.filter((slot) => !slot.past);
    expect(past.map((s) => new Date(s.startsAt).getHours())).toEqual([9, 9, 10, 11]);
    expect(future.length).toBeGreaterThan(0);
    expect(service.listAvailableSlots({ carId: car.id, date: "2026-10-01" }).map((s) => s.id)).toEqual(future.map((s) => s.id));
    expect(() => service.createBooking({ slotId: past[0].id, customerName: "Ada" })).toThrow(/already started/);
    expect(service.listSlotDays(car.id)[0].available).toBe(future.length);
  });

  it("validates the enum fields of a car", () => {
    expect(() => service.createCar({ ...SEED_CARS[0], bodyType: "boat" as never })).toThrow(/bodyType/);
    expect(() => service.createCar({ ...SEED_CARS[0], powertrain: "steam" as never })).toThrow(/powertrain/);
    expect(() => service.createCar({ ...SEED_CARS[0], transmission: "cvt" as never })).toThrow(/transmission/);
    expect(() => service.createCar({ ...SEED_CARS[0], drivetrain: "6x6" as never })).toThrow(/drivetrain/);
  });

  it("adds a model through one service method, creating the brand when new", () => {
    const first = service.addModel("Volvo", "V70");
    const second = service.addModel("volvo", "XC60");
    expect(second.brandId).toBe(first.brandId);
    expect(() => service.addModel("Volvo", "v70")).toThrow(ValidationError);
  });

  it("finds a car by name without loading the whole fleet", () => {
    const spy = vi.spyOn(service, "findCars");
    expect(service.findCar("norra vik")?.model).toBe("Vik");
    expect(service.findCar("Vik")?.model).toBe("Vik");
    expect(service.findCar("kestrel")?.brand).toBe("Kestrel");
    expect(spy).not.toHaveBeenCalled();
  });

  it("opens on the first upcoming day with free slots when today is sold out or over", () => {
    const car = service.findCar("Norra Fjell")!;
    for (const slot of service.listAvailableSlots({ carId: car.id, date: "2026-10-01" })) {
      service.createBooking({ slotId: slot.id, customerName: "Full" });
    }
    expect(loadBookingView(service, car.id, undefined)?.selected).toBe("2026-10-02");
  });

  it("falls back to the default day for an impossible calendar date", () => {
    const car = service.findCar("Norra Fjell")!;
    const view = loadBookingView(service, car.id, "2026-02-30");
    expect(view?.selected).toBe("2026-10-01");
  });
});

describe("event bus isolation", () => {
  it("keeps emitting when a listener throws", () => {
    const bus = createEventBus();
    const seen: string[] = [];
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    bus.subscribe(() => {
      throw new Error("boom");
    });
    bus.subscribe((event) => seen.push(event.type));
    expect(() => bus.emit({ type: "car.created", payload: { carId: "x" } })).not.toThrow();
    expect(seen).toEqual(["car.created"]);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
