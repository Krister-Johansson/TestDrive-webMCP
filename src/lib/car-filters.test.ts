import { describe, expect, it } from "vitest";
import {
  CarFilterError,
  filtersToSearchParams,
  parseCarFilters,
  parseCarFiltersLenient,
} from "./car-filters";

describe("parseCarFilters", () => {
  it("parses the same filter object from URLSearchParams and from tool arguments", () => {
    const fromUrl = parseCarFilters(
      new URLSearchParams("powertrain=electric&towHitch=true&minSeats=5&yearFrom=2024&brand=Norra"),
    );
    const fromArgs = parseCarFilters({
      powertrain: "electric",
      towHitch: true,
      minSeats: 5,
      yearFrom: 2024,
      brand: "Norra",
    });
    expect(fromUrl).toEqual(fromArgs);
    expect(fromUrl).toEqual({
      powertrain: "electric",
      towHitch: true,
      minSeats: 5,
      yearFrom: 2024,
      brand: "Norra",
    });
  });

  it("ignores empty values", () => {
    expect(parseCarFilters(new URLSearchParams("brand=&bodyType=&minSeats="))).toEqual({});
    expect(parseCarFilters({ brand: "", color: undefined, feature: "  " })).toEqual({});
  });

  it("rejects an unknown enum value with a readable message", () => {
    expect(() => parseCarFilters({ bodyType: "truck" })).toThrow(CarFilterError);
    expect(() => parseCarFilters({ bodyType: "truck" })).toThrow(/bodyType/);
    expect(() => parseCarFilters({ bodyType: "truck" })).toThrow(/suv/);
  });

  it("accepts a model and only the listed colors", () => {
    expect(parseCarFilters({ brand: "Norra", model: "Vik", color: "Green" })).toEqual({ brand: "Norra", model: "Vik", color: "Green" });
    expect(() => parseCarFilters({ color: "Rosso" })).toThrow(/color/);
  });

  it("accepts towHitch as a boolean or as the strings true and false", () => {
    expect(parseCarFilters({ towHitch: false })).toEqual({ towHitch: false });
    expect(parseCarFilters({ towHitch: "false" })).toEqual({ towHitch: false });
    expect(() => parseCarFilters({ towHitch: "maybe" })).toThrow(CarFilterError);
  });

  it("rejects a year range where yearFrom is after yearTo", () => {
    expect(() => parseCarFilters({ yearFrom: 2025, yearTo: 2020 })).toThrow(/yearFrom/);
  });
});

describe("parseCarFiltersLenient", () => {
  it("drops invalid keys instead of throwing", () => {
    const params = new URLSearchParams("bodyType=truck&powertrain=electric&minSeats=abc");
    expect(parseCarFiltersLenient(params)).toEqual({ powertrain: "electric" });
  });
});

describe("filtersToSearchParams", () => {
  it("round-trips through the URL", () => {
    const filters = parseCarFilters({
      brand: "Norra",
      bodyType: "suv",
      towHitch: true,
      minSeats: 5,
      yearFrom: 2023,
      yearTo: 2026,
      feature: "heated seats",
    });
    const params = filtersToSearchParams(filters);
    expect(parseCarFilters(params)).toEqual(filters);
  });

  it("produces an empty string for no filters", () => {
    expect(filtersToSearchParams({}).toString()).toBe("");
  });
});
