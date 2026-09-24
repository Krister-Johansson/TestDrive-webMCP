import { describe, expect, it } from "vitest";
import { createEventBus } from "./events";

describe("event bus", () => {
  it("delivers events to subscribers and stops after unsubscribe", () => {
    const bus = createEventBus();
    const seen: string[] = [];
    const unsubscribe = bus.subscribe((event) => seen.push(event.type));
    bus.emit({ type: "booking.created", payload: { bookingId: "b1", slotId: "s1", carId: "c1" } });
    unsubscribe();
    bus.emit({ type: "booking.cancelled", payload: { bookingId: "b1", slotId: "s1", carId: "c1" } });
    expect(seen).toEqual(["booking.created"]);
  });

  it("stamps every event with a time", () => {
    const bus = createEventBus();
    let at: number | undefined;
    bus.subscribe((event) => (at = event.at));
    bus.emit({ type: "slots.generated", payload: { carId: "c1", count: 3 } });
    expect(typeof at).toBe("number");
  });
});
