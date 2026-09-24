import { describe, expect, it } from "vitest";
import { parseResultsView } from "./results-view";

describe("parseResultsView", () => {
  it("only accepts the two known views", () => {
    expect(parseResultsView("table")).toBe("table");
    expect(parseResultsView("cards")).toBe("cards");
    expect(parseResultsView(undefined)).toBe("cards");
    expect(parseResultsView("list")).toBe("cards");
  });
});
