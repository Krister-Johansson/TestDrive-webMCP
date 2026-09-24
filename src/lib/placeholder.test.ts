import { describe, expect, it } from "vitest";
import { contrastRatio, placeholderPalette } from "./placeholder";

describe("placeholderPalette", () => {
  it("is deterministic and returns valid hex colors", () => {
    const a = placeholderPalette("8QGw0-wl-Y");
    const b = placeholderPalette("8QGw0-wl-Y");
    expect(a).toEqual(b);
    for (const value of [a.background, a.accent, a.text]) expect(value).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("spreads different ids across different hues", () => {
    const hues = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => placeholderPalette(id).hue));
    expect(hues.size).toBeGreaterThanOrEqual(6);
  });

  it("always picks a text color with at least 4.5:1 contrast against the background", () => {
    for (let i = 0; i < 200; i++) {
      const palette = placeholderPalette(`car-${i}`);
      expect(contrastRatio(palette.text, palette.background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
