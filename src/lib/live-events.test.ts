import { describe, expect, it } from "vitest";
import { createTestDb } from "@/db";
import { createBookingService } from "./booking-service";
import { createEventBus, type DomainEvent } from "./events";
import { enrichEvent, parseLiveEvent } from "./live-events";
import { SEED_CARS } from "@/db/seed";

describe("enrichEvent", () => {
  it("adds a human label with car and time for booking events", () => {
    const service = createBookingService(createTestDb(), createEventBus());
    const car = service.createCar(SEED_CARS[0]);
    service.generateSlots({ carId: car.id, from: "2026-10-02", to: "2026-10-02", startHour: 14, endHour: 15 });
    const slot = service.listSlots({ carId: car.id, date: "2026-10-02" })[0];
    const booking = service.createBooking({ slotId: slot.id, customerName: "Ada" });
    const event: DomainEvent = {
      type: "booking.created",
      payload: { bookingId: booking.id, slotId: slot.id, carId: car.id },
      at: Date.now(),
    };
    const live = enrichEvent(service, event);
    expect(live.label).toContain("Norra Fjell");
    expect(live.label).toContain("14:00");
    expect(live.label).toMatch(/booked/i);
    expect(live.payload).toMatchObject({ bookingId: booking.id });
  });

  it("labels other events without a lookup", () => {
    const service = createBookingService(createTestDb(), createEventBus());
    const live = enrichEvent(service, {
      type: "slots.generated",
      payload: { carId: "x", count: 4 },
      at: 1,
    });
    expect(live.label).toContain("4");
  });
});

describe("parseLiveEvent", () => {
  it("parses a JSON string into a live event and rejects junk", () => {
    const parsed = parseLiveEvent('{"type":"booking.created","payload":{"bookingId":"b","slotId":"s","carId":"c"},"at":1,"label":"x"}');
    expect(parsed?.type).toBe("booking.created");
    expect(parseLiveEvent("not json")).toBeNull();
    expect(parseLiveEvent('{"type":"nope"}')).toBeNull();
  });
});
