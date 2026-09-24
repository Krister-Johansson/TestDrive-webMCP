import { describe, expect, it } from "vitest";
import { CAR_COLORS, COLOR_NAMES, colorHex } from "./car-enums";

describe("car colors", () => {
  it("is a fixed list with a hex value for every name", () => {
    expect(CAR_COLORS.length).toBeGreaterThanOrEqual(8);
    for (const color of CAR_COLORS) {
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(COLOR_NAMES).toContain("White");
    expect(colorHex("Black")).toBe(CAR_COLORS.find((c) => c.name === "Black")!.hex);
  });

  it("falls back to grey for an unknown name", () => {
    expect(colorHex("Nope" as never)).toBe(colorHex("Grey"));
  });
});
