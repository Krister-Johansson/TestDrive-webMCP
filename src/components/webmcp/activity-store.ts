import { useSyncExternalStore } from "react";

export type ActivityStatus = "running" | "done" | "error";

export type ActivityEntry = {
  id: number;
  tool: string;
  args: string;
  status: ActivityStatus;
  summary: string | null;
  startedAt: number;
};

const LIMIT = 6;
const ARGS_MAX = 80;

let entries: ActivityEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function setEntries(next: ActivityEntry[]) {
  entries = next;
  for (const listener of listeners) listener();
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Turns tool input into "key: value" pairs short enough for one line in the feed. */
export function summarizeArgs(input: Record<string, unknown>): string {
  const text = Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join(", ");
  return text.length > ARGS_MAX ? `${text.slice(0, ARGS_MAX - 1)}…` : text;
}

export function startCall(tool: string, input: Record<string, unknown>): number {
  const id = nextId++;
  const entry: ActivityEntry = { id, tool, args: summarizeArgs(input), status: "running", summary: null, startedAt: Date.now() };
  setEntries([entry, ...entries].slice(0, LIMIT));
  return id;
}

export function finishCall(id: number, result: { ok: boolean; text: string }) {
  const summary = result.text.split("\n", 1)[0] ?? "";
  setEntries(
    entries.map((entry) => (entry.id === id ? { ...entry, status: result.ok ? "done" : "error", summary } : entry)),
  );
}

export function clearActivity() {
  setEntries([]);
}

export function getActivity() {
  return entries;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverEntries: ActivityEntry[] = [];

export function useActivity(): ActivityEntry[] {
  return useSyncExternalStore(subscribe, () => entries, () => serverEntries);
}
