import { describe, expect, it } from "vitest";
import { TOOL_DEFS, TOOL_LIMITS } from "./tool-defs";

describe("tool definitions", () => {
  const tools = Object.values(TOOL_DEFS);

  it("defines the shared tool set", () => {
    expect(Object.keys(TOOL_DEFS).sort()).toEqual(
      [
        "find_cars",
        "list_available_slots",
        "get_booking",
        "book_test_drive",
        "cancel_booking",
        "list_bookings",
        "create_car",
        "generate_slots",
        "filter_cars",
        "select_car",
        "select_slot",
        "list_brands",
        "add_model",
      ].sort(),
    );
  });

  it("describes brand, model, and color inputs consistently", () => {
    expect(Object.keys(TOOL_DEFS.find_cars.params)).toContain("model");
    expect(Object.keys(TOOL_DEFS.create_car.params)).not.toContain("colorHex");
    expect(TOOL_DEFS.create_car.params.color).toMatch(/White/);
    expect(TOOL_DEFS.list_brands.annotations.readOnlyHint).toBe(true);
    expect(TOOL_DEFS.add_model.annotations.consequentialHint).toBe(true);
  });

  it("keeps every name within the WebMCP name limit", () => {
    for (const tool of tools) {
      expect(tool.name.length, tool.name).toBeLessThanOrEqual(TOOL_LIMITS.name);
      expect(tool.name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("keeps descriptions within limits", () => {
    for (const tool of tools) {
      expect(tool.description.length, tool.name).toBeLessThanOrEqual(TOOL_LIMITS.description);
      expect(tool.description.length, tool.name).toBeGreaterThan(20);
      for (const [param, description] of Object.entries(tool.params)) {
        expect(param.length, `${tool.name}.${param}`).toBeLessThanOrEqual(TOOL_LIMITS.name);
        expect(description.length, `${tool.name}.${param}`).toBeLessThanOrEqual(
          TOOL_LIMITS.paramDescription,
        );
      }
    }
  });

  it("marks state-changing tools as consequential and reads as read-only", () => {
    expect(TOOL_DEFS.find_cars.annotations.readOnlyHint).toBe(true);
    expect(TOOL_DEFS.list_available_slots.annotations.readOnlyHint).toBe(true);
    expect(TOOL_DEFS.book_test_drive.annotations.consequentialHint).toBe(true);
    expect(TOOL_DEFS.cancel_booking.annotations.consequentialHint).toBe(true);
    expect(TOOL_DEFS.book_test_drive.annotations.readOnlyHint).toBe(false);
  });
});
