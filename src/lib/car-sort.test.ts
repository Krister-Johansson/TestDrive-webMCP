import { describe, expect, it } from "vitest";
import { makeCar } from "../../tests/fixtures";
import { keepSort, nextSortQuery, parseCarSort, sortCars } from "./car-sort";

// Norra Fjell 2026 7 seats, Norra Vik 2025, Norra Skog 2024, Aldo Cinque 2023 4 seats, Aldo Sera 2026 2 seats.
const cars = [0, 1, 2, 3, 4].map((index) => makeCar({}, index));
const names = (list: typeof cars) => list.map((car) => car.model);

describe("car sorting", () => {
  it("parses a known column and direction and ignores anything else", () => {
    expect(parseCarSort(new URLSearchParams("sort=year&order=desc"))).toEqual({ key: "year", order: "desc" });
    expect(parseCarSort(new URLSearchParams("sort=seats"))).toEqual({ key: "seats", order: "asc" });
    expect(parseCarSort(new URLSearchParams("sort=price"))).toBeNull();
    expect(parseCarSort(new URLSearchParams("powertrain=electric"))).toBeNull();
  });

  it("keeps the given order when there is no sort", () => {
    expect(names(sortCars(cars, null))).toEqual(["Fjell", "Vik", "Skog", "Cinque", "Sera"]);
  });

  it("sorts numbers and breaks ties by car name", () => {
    expect(names(sortCars(cars, { key: "year", order: "asc" }))).toEqual(["Cinque", "Skog", "Vik", "Sera", "Fjell"]);
    expect(names(sortCars(cars, { key: "year", order: "desc" }))).toEqual(["Sera", "Fjell", "Vik", "Skog", "Cinque"]);
    expect(names(sortCars(cars, { key: "seats", order: "desc" }))[0]).toBe("Fjell");
  });

  it("sorts names and enum columns by their visible label", () => {
    expect(names(sortCars(cars, { key: "car", order: "asc" }))).toEqual(["Cinque", "Sera", "Fjell", "Skog", "Vik"]);
    // Coupe, Hatchback, Sedan, SUV, Wagon
    expect(names(sortCars(cars, { key: "body", order: "asc" }))).toEqual(["Sera", "Cinque", "Skog", "Fjell", "Vik"]);
  });

  it("does not change the input array", () => {
    const copy = [...cars];
    sortCars(cars, { key: "year", order: "asc" });
    expect(cars).toEqual(copy);
  });

  it("builds the next query: a new column starts ascending, the same column flips", () => {
    const current = new URLSearchParams("powertrain=electric");
    expect(nextSortQuery(current, null, "year")).toBe("powertrain=electric&sort=year&order=asc");
    expect(nextSortQuery(current, { key: "year", order: "asc" }, "year")).toBe("powertrain=electric&sort=year&order=desc");
    expect(nextSortQuery(current, { key: "year", order: "desc" }, "year")).toBe("powertrain=electric&sort=year&order=asc");
    expect(nextSortQuery(current, { key: "year", order: "desc" }, "seats")).toBe("powertrain=electric&sort=seats&order=asc");
  });

  it("carries the sort over to a query built from filters", () => {
    const filters = new URLSearchParams("bodyType=suv");
    expect(keepSort(filters, new URLSearchParams("powertrain=electric&sort=year&order=desc")).toString()).toBe(
      "bodyType=suv&sort=year&order=desc",
    );
    expect(keepSort(filters, new URLSearchParams("powertrain=electric")).toString()).toBe("bodyType=suv");
  });
});
