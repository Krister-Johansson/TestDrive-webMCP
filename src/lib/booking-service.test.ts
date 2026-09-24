import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "@/db";
import { createEventBus, type DomainEvent, type EventBus } from "./events";
import {
  BookingStateError,
  NotFoundError,
  SlotTakenError,
  createBookingService,
  type BookingService,
  type NewCar,
} from "./booking-service";

const baseCar: NewCar = {
  brand: "Norra",
  model: "Fjell",
  year: 2026,
  bodyType: "suv",
  powertrain: "electric",
  transmission: "automatic",
  drivetrain: "awd",
  color: "White",
  seats: 7,
  towHitch: true,
  features: ["panoramic roof", "heated seats", "adaptive cruise"],
  tagline: "Seven seats, zero tailpipe.",
};

describe("booking service", () => {
  let db: Db;
  let bus: EventBus;
  let service: BookingService;
  let events: DomainEvent[];

  beforeEach(() => {
    db = createTestDb();
    bus = createEventBus();
    events = [];
    bus.subscribe((event) => events.push(event));
    service = createBookingService(db, bus);
  });

  describe("cars", () => {
    beforeEach(() => {
      service.createCar(baseCar);
      service.createCar({
        ...baseCar,
        model: "Vik",
        bodyType: "wagon",
        powertrain: "plug-in-hybrid",
        transmission: "manual",
        drivetrain: "fwd",
        color: "Green",
        seats: 5,
        towHitch: false,
        features: ["roof rails"],
        year: 2023,
      });
      service.createCar({
        ...baseCar,
        brand: "Aldo",
        model: "Cinque",
        bodyType: "hatchback",
        powertrain: "petrol",
        transmission: "manual",
        drivetrain: "fwd",
        color: "Red",
        seats: 4,
        towHitch: false,
        features: [],
        year: 2021,
      });
    });

    it("lists active cars sorted by brand then model when no filter is given", () => {
      const cars = service.findCars({});
      expect(cars.map((car) => `${car.brand} ${car.model}`)).toEqual([
        "Aldo Cinque",
        "Norra Fjell",
        "Norra Vik",
      ]);
    });

    it("filters by a single property", () => {
      expect(service.findCars({ powertrain: "electric" }).map((c) => c.model)).toEqual(["Fjell"]);
      expect(service.findCars({ transmission: "manual" }).map((c) => c.model)).toEqual([
        "Cinque",
        "Vik",
      ]);
    });

    it("combines filters with AND", () => {
      expect(
        service.findCars({ transmission: "manual", towHitch: false, bodyType: "wagon" }).map((c) => c.model),
      ).toEqual(["Vik"]);
      expect(service.findCars({ transmission: "manual", powertrain: "electric" })).toEqual([]);
    });

    it("treats minSeats and the year range as inclusive bounds", () => {
      expect(service.findCars({ minSeats: 5 }).map((c) => c.model)).toEqual(["Fjell", "Vik"]);
      expect(service.findCars({ minSeats: 8 })).toEqual([]);
      expect(service.findCars({ yearFrom: 2023, yearTo: 2023 }).map((c) => c.model)).toEqual(["Vik"]);
      expect(service.findCars({ yearFrom: 2022 }).map((c) => c.model)).toEqual(["Fjell", "Vik"]);
      expect(service.findCars({ yearTo: 2022 }).map((c) => c.model)).toEqual(["Cinque"]);
    });

    it("matches brand and feature case-insensitively as substrings, color exactly", () => {
      expect(service.findCars({ brand: "norra" })).toHaveLength(2);
      expect(service.findCars({ color: "Green" }).map((c) => c.model)).toEqual(["Vik"]);
      expect(service.findCars({ feature: "Heated" }).map((c) => c.model)).toEqual(["Fjell"]);
      expect(service.findCars({ feature: "rails" }).map((c) => c.model)).toEqual(["Vik"]);
    });

    it("hides inactive cars unless asked for them", () => {
      const vik = service.findCars({ color: "Green" })[0];
      service.updateCar(vik.id, { active: false });
      expect(service.findCars({}).map((c) => c.model)).toEqual(["Cinque", "Fjell"]);
      expect(service.findCars({}, { includeInactive: true })).toHaveLength(3);
    });

    it("finds a car by id, by full name, or by model name", () => {
      const fjell = service.findCars({ powertrain: "electric" })[0];
      expect(service.findCar(fjell.id)?.id).toBe(fjell.id);
      expect(service.findCar("Norra Fjell")?.id).toBe(fjell.id);
      expect(service.findCar("fjell")?.id).toBe(fjell.id);
      expect(service.findCar("nothing like this")).toBeNull();
    });

    it("emits car events", () => {
      const car = service.createCar({ ...baseCar, model: "Skog" });
      service.updateCar(car.id, { color: "Blue" });
      expect(events.map((e) => e.type)).toEqual(
        expect.arrayContaining(["car.created", "car.updated"]),
      );
      expect(service.findCar(car.id)?.color).toBe("Blue");
    });
  });

  describe("slots", () => {
    let carId: string;
    beforeEach(() => {
      carId = service.createCar(baseCar).id;
    });

    it("generates 45 minute slots inside the hours for every day in the range", () => {
      const slots = service.generateSlots({
        carId,
        from: "2026-10-01",
        to: "2026-10-02",
        startHour: 9,
        endHour: 12,
      });
      expect(slots).toHaveLength(8);
      const first = new Date(slots[0].startsAt);
      expect([first.getHours(), first.getMinutes()]).toEqual([9, 0]);
      const last = new Date(slots[3].startsAt);
      expect([last.getHours(), last.getMinutes()]).toEqual([11, 15]);
      expect(slots[0].endsAt - slots[0].startsAt).toBe(45 * 60 * 1000);
      expect(events.at(-1)).toMatchObject({ type: "slots.generated", payload: { carId, count: 8 } });
    });

    it("does not duplicate slots that already exist", () => {
      const args = { carId, from: "2026-10-01", to: "2026-10-01", startHour: 9, endHour: 10 };
      service.generateSlots(args);
      const second = service.generateSlots(args);
      expect(second).toHaveLength(0);
      expect(service.listSlots({ carId, date: "2026-10-01" })).toHaveLength(1);
    });

    it("rejects an unknown car", () => {
      expect(() =>
        service.generateSlots({ carId: "nope", from: "2026-10-01", to: "2026-10-01", startHour: 9, endHour: 10 }),
      ).toThrow(NotFoundError);
    });

    it("lists slots for a day with their booking state", () => {
      service.generateSlots({ carId, from: "2026-10-01", to: "2026-10-01", startHour: 9, endHour: 11 });
      const [first] = service.listSlots({ carId, date: "2026-10-01" });
      service.createBooking({ slotId: first.id, customerName: "Ada" });
      const slots = service.listSlots({ carId, date: "2026-10-01" });
      expect(slots[0].booking).toMatchObject({ customerName: "Ada" });
      expect(slots[1].booking).toBeNull();
      expect(service.listAvailableSlots({ carId, date: "2026-10-01" }).map((s) => s.id)).not.toContain(
        first.id,
      );
    });

    it("refuses to delete a slot with a confirmed booking", () => {
      service.generateSlots({ carId, from: "2026-10-01", to: "2026-10-01", startHour: 9, endHour: 10 });
      const [slot] = service.listSlots({ carId, date: "2026-10-01" });
      service.createBooking({ slotId: slot.id, customerName: "Ada" });
      expect(() => service.deleteSlot(slot.id)).toThrow(BookingStateError);
    });
  });

  describe("bookings", () => {
    let slotId: string;
    let carId: string;
    beforeEach(() => {
      carId = service.createCar(baseCar).id;
      service.generateSlots({ carId, from: "2026-10-01", to: "2026-10-01", startHour: 9, endHour: 10 });
      slotId = service.listSlots({ carId, date: "2026-10-01" })[0].id;
    });

    it("books a free slot and emits booking.created", () => {
      const booking = service.createBooking({ slotId, customerName: "Ada", customerEmail: "ada@example.com" });
      expect(booking.status).toBe("confirmed");
      expect(events.at(-1)).toMatchObject({
        type: "booking.created",
        payload: { bookingId: booking.id, slotId, carId },
      });
    });

    it("throws SlotTakenError for a slot that already has a confirmed booking", () => {
      service.createBooking({ slotId, customerName: "Ada" });
      expect(() => service.createBooking({ slotId, customerName: "Bob" })).toThrow(SlotTakenError);
    });

    it("throws NotFoundError for an unknown slot", () => {
      expect(() => service.createBooking({ slotId: "missing", customerName: "Ada" })).toThrow(NotFoundError);
    });

    it("requires a customer name", () => {
      expect(() => service.createBooking({ slotId, customerName: "  " })).toThrow(/name/i);
    });

    it("cancelling frees the slot and emits booking.cancelled", () => {
      const booking = service.createBooking({ slotId, customerName: "Ada" });
      const cancelled = service.cancelBooking(booking.id);
      expect(cancelled.status).toBe("cancelled");
      expect(events.at(-1)).toMatchObject({ type: "booking.cancelled", payload: { bookingId: booking.id } });
      expect(() => service.cancelBooking(booking.id)).toThrow(BookingStateError);
      expect(service.createBooking({ slotId, customerName: "Bob" }).status).toBe("confirmed");
    });

    it("returns booking details with car and slot", () => {
      const booking = service.createBooking({ slotId, customerName: "Ada" });
      const detail = service.getBooking(booking.id);
      expect(detail?.car.model).toBe("Fjell");
      expect(detail?.slot.id).toBe(slotId);
      expect(service.getBooking("missing")).toBeNull();
    });

    it("lists bookings newest first and filters by status", () => {
      const a = service.createBooking({ slotId, customerName: "Ada" });
      service.cancelBooking(a.id);
      const b = service.createBooking({ slotId, customerName: "Bob" });
      expect(service.listBookings().map((x) => x.id)).toEqual([b.id, a.id]);
      expect(service.listBookings({ status: "confirmed" }).map((x) => x.id)).toEqual([b.id]);
    });
  });
});
