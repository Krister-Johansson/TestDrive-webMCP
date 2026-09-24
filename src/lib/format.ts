import { format, isToday, isTomorrow } from "date-fns";

export function carName(car: { brand: string; model: string }) {
  return `${car.brand} ${car.model}`;
}

export function formatTime(epochMs: number): string {
  return format(epochMs, "HH:mm");
}

export function formatDay(epochMs: number | Date): string {
  if (isToday(epochMs)) return "Today";
  if (isTomorrow(epochMs)) return "Tomorrow";
  return format(epochMs, "EEE d MMM");
}

export function formatSlotTime(epochMs: number): string {
  return `${formatDay(epochMs)} ${formatTime(epochMs)}`;
}

export function formatLongDate(epochMs: number | Date): string {
  return format(epochMs, "EEEE d MMMM yyyy");
}
