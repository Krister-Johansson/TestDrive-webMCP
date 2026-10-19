"use client";

import { useEffect } from "react";
import { useWebMCP } from "usewebmcp";
import type { ToolDef } from "@/lib/tool-defs";
import { clamp } from "@/lib/tool-output";
import type { ObjectSchema } from "@/lib/webmcp-schemas";
import { finishCall, startCall } from "./activity-store";
import { useWebMcp } from "./provider";

export type ToolFailure = { content: { type: "text"; text: string }[]; isError: true };

export function toolError(message: string): ToolFailure {
  return { content: [{ type: "text", text: message }], isError: true };
}

export type AppToolExecute = (input: Record<string, unknown>) => Promise<string | ToolFailure>;

/**
 * Registers one WebMCP tool from the shared definitions. The tool is exposed while the
 * calling component is mounted and the browser has WebMCP.
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
        const args = input as Record<string, unknown>;
        const callId = startCall(def.name, args);
        let result: string | ToolFailure;
        try {
          const output = await execute(args);
          result = typeof output === "string" ? clamp(output) : output;
        } catch (error) {
          result = toolError(error instanceof Error ? error.message : String(error));
        }
        // Every call lands in the on-page activity feed so the audience sees what the agent did.
        finishCall(callId, typeof result === "string" ? { ok: true, text: result } : { ok: false, text: result.content[0]?.text ?? "" });
        return result;
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
