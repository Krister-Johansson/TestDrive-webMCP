"use client";

import { useEffect } from "react";
import { useWebMCP } from "usewebmcp";
import type { ToolDef } from "@/lib/tool-defs";
import { clamp } from "@/lib/tool-output";
import type { ObjectSchema } from "@/lib/webmcp-schemas";
import { useWebMcp } from "./provider";

export type ToolFailure = { content: { type: "text"; text: string }[]; isError: true };

export function toolError(message: string): ToolFailure {
  return { content: [{ type: "text", text: message }], isError: true };
}

export type AppToolExecute = (input: Record<string, unknown>) => Promise<string | ToolFailure>;

/**
 * Registers one WebMCP tool from the shared definitions. Registration follows the
 * header toggle: the tool is only exposed while WebMCP is on and the browser has it.
 */
export function useAppTool(def: ToolDef, inputSchema: ObjectSchema, execute: AppToolExecute, deps: unknown[] = []) {
  const {
    state: { active },
    actions: { track, untrack },
  } = useWebMcp();

  useWebMCP(
    {
      name: def.name,
      description: def.description,
      inputSchema,
      annotations: def.annotations,
      enabled: active,
      execute: async (input) => {
        try {
          const result = await execute(input as Record<string, unknown>);
          return typeof result === "string" ? clamp(result) : result;
        } catch (error) {
          return toolError(error instanceof Error ? error.message : String(error));
        }
      },
    },
    deps,
  );

  useEffect(() => {
    if (!active) return;
    track(def.name);
    return () => untrack(def.name);
  }, [active, def.name, track, untrack]);
}
