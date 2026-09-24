import { describe, expect, it } from "vitest";
import { TOOL_DEFS, TOOL_LIMITS } from "./tool-defs";
import { WEBMCP_SCHEMAS } from "./webmcp-schemas";

describe("WebMCP JSON schemas", () => {
  it("covers every WebMCP tool with described properties that match the tool definitions", () => {
    for (const [name, schema] of Object.entries(WEBMCP_SCHEMAS)) {
      const def = TOOL_DEFS[name as keyof typeof TOOL_DEFS];
      expect(def, name).toBeDefined();
      expect(schema.type).toBe("object");
      expect(Object.keys(schema.properties).sort()).toEqual(Object.keys(def.params).sort());
      for (const [key, property] of Object.entries(schema.properties)) {
        expect(property.description, `${name}.${key}`).toBe((def.params as Record<string, string>)[key]);
        expect(property.description.length).toBeLessThanOrEqual(TOOL_LIMITS.paramDescription);
      }
    }
  });

  it("marks required inputs", () => {
    expect(WEBMCP_SCHEMAS.book_test_drive.required).toEqual(["slotId", "customerName"]);
    expect(WEBMCP_SCHEMAS.list_available_slots.required).toEqual(["car", "date"]);
    expect(WEBMCP_SCHEMAS.find_cars.required).toEqual([]);
    expect(WEBMCP_SCHEMAS.find_cars.properties.bodyType.enum).toContain("suv");
  });
});
