import { describe, expect, it } from "vitest";
import type { LiveEvent } from "./live-events";
import { shouldRefreshFor } from "./live-refresh";

const booked = (carId: string): LiveEvent => ({ type: "booking.created", payload: { bookingId: "b", slotId: "s", carId }, at: 1, label: "" });
const carUpdated: LiveEvent = { type: "car.updated", payload: { carId: "x" }, at: 1, label: "" };

describe("shouldRefreshFor", () => {
  it("refreshes the list, admin, and booking pages for any event", () => {
    for (const path of ["/", "/admin", "/bookings/abc"]) {
      expect(shouldRefreshFor(path, booked("c1"))).toBe(true);
    }
  });
  it("refreshes a car page only for its own car or fleet changes", () => {
    expect(shouldRefreshFor("/book/c1", booked("c1"))).toBe(true);
    expect(shouldRefreshFor("/book/c1", booked("c2"))).toBe(false);
    expect(shouldRefreshFor("/book/c1", carUpdated)).toBe(true);
  });
  it("never refreshes the connect page", () => {
    expect(shouldRefreshFor("/connect", booked("c1"))).toBe(false);
  });
});
