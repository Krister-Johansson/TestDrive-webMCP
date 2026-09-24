import { ISO_DAY_PATTERN as ISO_DAY } from "./dates";

/** Start minutes (from midnight) of every slot that fits between startHour and endHour. */
export function slotStartsForDay(startHour: number, endHour: number, durationMinutes: number): number[] {
  const starts: number[] = [];
  for (let minutes = startHour * 60; minutes + durationMinutes <= endHour * 60; minutes += durationMinutes) {
    starts.push(minutes);
  }
  return starts;
}

export function daysBetween(from: string, to: string): number {
  if (!ISO_DAY.test(from) || !ISO_DAY.test(to)) return 0;
  const a = Date.UTC(...splitDay(from));
  const b = Date.UTC(...splitDay(to));
  if (Number.isNaN(a) || Number.isNaN(b) || a > b) return 0;
  return Math.round((b - a) / 86_400_000) + 1;
}

export function countSlots(input: {
  from: string;
  to: string;
  startHour: number;
  endHour: number;
  durationMinutes?: number;
}): number {
  const perDay = slotStartsForDay(input.startHour, input.endHour, input.durationMinutes ?? 45).length;
  return perDay * daysBetween(input.from, input.to);
}

function splitDay(day: string): [number, number, number] {
  const [y, m, d] = day.split("-").map(Number);
  return [y, m - 1, d];
}
