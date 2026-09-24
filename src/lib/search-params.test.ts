import { describe, expect, it } from "vitest";
import { queryFrom, withQuery } from "./search-params";

describe("search params helpers", () => {
  it("keeps string params, applies overrides, and removes nulls", () => {
    expect(queryFrom({ brand: "Norra", date: "2026-10-01", x: ["a"] }, { date: null })).toBe("brand=Norra");
    expect(queryFrom({ brand: "Norra" }, { date: "2026-10-02" })).toBe("brand=Norra&date=2026-10-02");
    expect(queryFrom(new URLSearchParams("a=1"), { b: "2" })).toBe("a=1&b=2");
  });
  it("joins a path and a query", () => {
    expect(withQuery("/book/x", "")).toBe("/book/x");
    expect(withQuery("/book/x", "brand=Norra")).toBe("/book/x?brand=Norra");
  });
});
