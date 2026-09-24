"use client";

import { parseCarFilters, type CarFilters } from "@/lib/car-filters";
import { TOOL_DEFS } from "@/lib/tool-defs";
import { WEBMCP_SCHEMAS } from "@/lib/webmcp-schemas";
import { toolError, useAppTool } from "./use-app-tool";

export type HomeToolsetProps = {
  /** Applies filters to the page and resolves with how many cars match. */
  applyFilters: (filters: CarFilters) => Promise<number>;
  /** Opens a car's booking page and resolves with a short confirmation. */
  openCar: (query: string) => Promise<string>;
};

export function HomeToolset({ applyFilters, openCar }: HomeToolsetProps) {
  useAppTool(TOOL_DEFS.filter_cars, WEBMCP_SCHEMAS.filter_cars, async (input) => {
    const filters = parseCarFilters(input);
    const count = await applyFilters(filters);
    const summary = Object.keys(filters).length ? JSON.stringify(filters) : "no filters";
    return `Applied ${summary}. ${count} car${count === 1 ? "" : "s"} shown. Use find_cars for details.`;
  });

  useAppTool(TOOL_DEFS.select_car, WEBMCP_SCHEMAS.select_car, async (input) => {
    const query = typeof input.car === "string" ? input.car : "";
    if (!query) return toolError("Pass the car id or name.");
    return openCar(query);
  });

  return null;
}
