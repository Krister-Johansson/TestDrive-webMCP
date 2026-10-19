import { describe, expect, it } from "vitest";
import { DEFAULT_TABLE_LAYOUT, moveColumn, parseTableLayout, placeColumn, serializeTableLayout, TABLE_COLUMN_IDS } from "./car-table-layout";

describe("car table layout", () => {
  it("starts with every column in order, brand hidden, and no custom widths", () => {
    expect(DEFAULT_TABLE_LAYOUT).toEqual({ order: [...TABLE_COLUMN_IDS], sizing: {}, hidden: ["brand"] });
    expect(parseTableLayout(undefined)).toEqual(DEFAULT_TABLE_LAYOUT);
    expect(parseTableLayout("not json")).toEqual(DEFAULT_TABLE_LAYOUT);
  });

  it("round-trips through the cookie value", () => {
    const layout = { order: ["year", ...TABLE_COLUMN_IDS.filter((id) => id !== "year")], sizing: { car: 320 }, hidden: ["color"] };
    expect(parseTableLayout(serializeTableLayout(layout))).toEqual(layout);
  });

  it("drops unknown columns, appends missing ones, and never hides the car column", () => {
    const raw = serializeTableLayout({ order: ["seats", "ghost", "car"], sizing: { ghost: 200, year: 5000 }, hidden: ["car", "ghost", "drive"] });
    const layout = parseTableLayout(raw);
    expect(layout.order.slice(0, 2)).toEqual(["seats", "car"]);
    expect([...layout.order].sort()).toEqual([...TABLE_COLUMN_IDS].sort());
    expect(layout.sizing).toEqual({ year: 600 });
    expect(layout.hidden).toEqual(["drive"]);
  });

  it("moves a column one step and stops at the edges", () => {
    const order = ["car", "year", "body"];
    expect(moveColumn(order, "year", 1)).toEqual(["car", "body", "year"]);
    expect(moveColumn(order, "year", -1)).toEqual(["year", "car", "body"]);
    expect(moveColumn(order, "car", -1)).toBe(order);
    expect(moveColumn(order, "body", 1)).toBe(order);
  });

  it("steps over hidden columns so one move changes what people see", () => {
    expect(moveColumn(["car", "brand", "year"], "car", 1, ["brand"])).toEqual(["brand", "year", "car"]);
    expect(moveColumn(["year", "brand", "car"], "car", -1, ["brand"])).toEqual(["car", "year", "brand"]);
    expect(moveColumn(["car", "brand"], "car", 1, ["brand"])).toEqual(["car", "brand"]);
  });

  it("places a column before or after another one, as a drop does", () => {
    const order = ["car", "year", "body", "seats"];
    expect(placeColumn(order, "seats", "year", "before")).toEqual(["car", "seats", "year", "body"]);
    expect(placeColumn(order, "car", "body", "after")).toEqual(["year", "body", "car", "seats"]);
    expect(placeColumn(order, "car", "car", "after")).toBe(order);
  });
});
