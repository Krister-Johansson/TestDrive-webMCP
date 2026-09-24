import { describe, expect, it } from "vitest";
import { countSlots, slotStartsForDay } from "./slot-math";

describe("slot math", () => {
  it("lists the start minutes of every slot that fits between the hours", () => {
    expect(slotStartsForDay(9, 12, 45)).toEqual([540, 585, 630, 675]);
    expect(slotStartsForDay(9, 10, 45)).toEqual([540]);
    expect(slotStartsForDay(9, 9, 45)).toEqual([]);
  });

  it("counts slots across a date range inclusive of both ends", () => {
    expect(countSlots({ from: "2026-10-01", to: "2026-10-02", startHour: 9, endHour: 12 })).toBe(8);
    expect(countSlots({ from: "2026-10-01", to: "2026-10-01", startHour: 9, endHour: 17 })).toBe(10);
    expect(countSlots({ from: "2026-10-03", to: "2026-10-01", startHour: 9, endHour: 17 })).toBe(0);
    expect(countSlots({ from: "", to: "2026-10-01", startHour: 9, endHour: 17 })).toBe(0);
  });
});
