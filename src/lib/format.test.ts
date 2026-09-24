import { describe, expect, it } from "vitest";
import { formatDay, formatSlotTime, formatTime } from "./format";

describe("format helpers", () => {
  const at = new Date(2026, 9, 2, 14, 0).getTime();
  it("formats a 24 hour time", () => {
    expect(formatTime(at)).toBe("14:00");
  });
  it("formats a day with weekday and month", () => {
    expect(formatDay(at)).toBe("Fri 2 Oct");
    expect(formatDay(new Date())).toBe("Today");
  });
  it("combines day and time", () => {
    expect(formatSlotTime(at)).toBe("Fri 2 Oct 14:00");
  });
});
