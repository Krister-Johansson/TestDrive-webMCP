import { describe, expect, it } from "vitest";
import { isOptimizableImage } from "./image-src";

describe("isOptimizableImage", () => {
  it("optimizes local files and allow-listed hosts only", () => {
    expect(isOptimizableImage("/cars/ex30-1.jpg")).toBe(true);
    expect(isOptimizableImage("https://upload.wikimedia.org/wikipedia/commons/a.jpg")).toBe(true);
    expect(isOptimizableImage("https://example.com/car.jpg")).toBe(false);
    expect(isOptimizableImage("not a url")).toBe(false);
  });
});
