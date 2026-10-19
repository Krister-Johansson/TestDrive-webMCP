/** Columns of the browse table that people can reorder, resize, and hide. The Book column stays last. */
export const TABLE_COLUMN_IDS = ["brand", "car", "year", "body", "powertrain", "gearbox", "drive", "seats", "towHitch", "color"] as const;
export type TableColumnId = (typeof TABLE_COLUMN_IDS)[number];

/** Versioned so a later change in meaning can start fresh. */
export const TABLE_LAYOUT_COOKIE = "testdrive.table-layout.v1";

export const COLUMN_MIN_WIDTH = 64;
export const COLUMN_MAX_WIDTH = 600;

/** Per-viewer table arrangement. Widths only hold columns someone resized; the rest use their default. */
export type TableLayout = { order: string[]; sizing: Record<string, number>; hidden: string[] };

export const DEFAULT_TABLE_LAYOUT: TableLayout = { order: [...TABLE_COLUMN_IDS], sizing: {}, hidden: ["brand"] };

const KNOWN = new Set<string>(TABLE_COLUMN_IDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/** Reads the cookie value. Anything unknown or malformed falls back to the default for that part. */
export function parseTableLayout(raw: string | undefined): TableLayout {
  if (!raw) return DEFAULT_TABLE_LAYOUT;
  let data: unknown;
  try {
    data = JSON.parse(decodeURIComponent(raw));
  } catch {
    return DEFAULT_TABLE_LAYOUT;
  }
  if (!isRecord(data)) return DEFAULT_TABLE_LAYOUT;

  const listed = [...new Set(stringList(data.order).filter((id) => KNOWN.has(id)))];
  const order = [...listed, ...TABLE_COLUMN_IDS.filter((id) => !listed.includes(id))];

  const sizing: Record<string, number> = {};
  if (isRecord(data.sizing)) {
    for (const [id, width] of Object.entries(data.sizing)) {
      if (KNOWN.has(id) && typeof width === "number" && Number.isFinite(width)) {
        sizing[id] = Math.round(Math.min(COLUMN_MAX_WIDTH, Math.max(COLUMN_MIN_WIDTH, width)));
      }
    }
  }

  const hidden = "hidden" in data ? stringList(data.hidden).filter((id) => KNOWN.has(id) && id !== "car") : DEFAULT_TABLE_LAYOUT.hidden;
  return { order, sizing, hidden };
}

export function serializeTableLayout(layout: TableLayout): string {
  return encodeURIComponent(JSON.stringify(layout));
}

/** A new order with `id` placed right before or after `target`; the same array when either is missing. */
export function placeColumn(order: string[], id: string, target: string, side: "before" | "after"): string[] {
  if (id === target || !order.includes(id)) return order;
  const next = order.filter((item) => item !== id);
  const at = next.indexOf(target);
  if (at === -1) return order;
  next.splice(side === "after" ? at + 1 : at, 0, id);
  return next;
}

/**
 * A new order with `id` moved one visible step left (-1) or right (1), stepping over hidden columns.
 * The same array when it cannot move.
 */
export function moveColumn(order: string[], id: string, delta: -1 | 1, hidden: string[] = []): string[] {
  const from = order.indexOf(id);
  if (from === -1) return order;
  const skip = new Set(hidden);
  let to = from + delta;
  while (to >= 0 && to < order.length && skip.has(order[to])) to += delta;
  if (to < 0 || to >= order.length) return order;
  return placeColumn(order, id, order[to], delta === 1 ? "after" : "before");
}
