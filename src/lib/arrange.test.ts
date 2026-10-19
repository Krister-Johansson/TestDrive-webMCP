import { describe, expect, it } from "vitest";
import { makeCar } from "../../tests/fixtures";
import { arrangeQuery, describeArrangement, parseArrangement } from "./arrange";

describe("arrange_cars input", () => {
  it("reads view, sort, and grouping, with ascending as the default order", () => {
    expect(parseArrangement({ view: "table", sortBy: "year", order: "desc", groupBy: "powertrain" })).toEqual({
      view: "table",
      sort: { key: "year", order: "desc" },
      group: "powertrain",
    });
    expect(parseArrangement({ sortBy: "seats" })).toEqual({ sort: { key: "seats", order: "asc" } });
    expect(parseArrangement({})).toEqual({});
  });

  it("treats none as clearing sort or grouping", () => {
    expect(parseArrangement({ sortBy: "none", groupBy: "none" })).toEqual({ sort: null, group: null });
  });

  it("switches to the table when grouping, since cards cannot show groups", () => {
    expect(parseArrangement({ groupBy: "body" })).toEqual({ view: "table", group: "body" });
  });

  it("rejects values the page cannot show, naming the valid ones", () => {
    expect(() => parseArrangement({ view: "grid" })).toThrow(/cards, table/);
    expect(() => parseArrangement({ sortBy: "price" })).toThrow(/brand, car, year/);
    expect(() => parseArrangement({ groupBy: "car" })).toThrow(/groupBy/);
    expect(() => parseArrangement({ order: "up" })).toThrow(/asc, desc/);
    expect(() => parseArrangement({ view: "cards", groupBy: "body" })).toThrow(/table/);
  });
});

describe("arrange_cars query", () => {
  it("changes only sort and group params and keeps the filters", () => {
    const current = new URLSearchParams("powertrain=electric&sort=year&order=asc");
    expect(arrangeQuery(current, { sort: { key: "seats", order: "desc" }, group: "body" }).toString()).toBe(
      "powertrain=electric&sort=seats&order=desc&group=body",
    );
    expect(arrangeQuery(current, { sort: null }).toString()).toBe("powertrain=electric");
    expect(arrangeQuery(current, { view: "table" }).toString()).toBe("powertrain=electric&sort=year&order=asc");
  });
});

describe("arrange_cars result", () => {
  const cars = [0, 1, 2, 3, 4].map((index) => makeCar({}, index));

  it("says what the page now shows, with the group count", () => {
    expect(
      describeArrangement({ view: "table", sort: { key: "year", order: "desc" }, group: "powertrain" }, cars),
    ).toBe("Showing 5 cars as a table, sorted by year (descending), grouped by powertrain into 4 groups.");
    expect(describeArrangement({ view: "cards", sort: null, group: null }, cars.slice(0, 1))).toBe("Showing 1 car as cards, in the default order.");
  });
});
