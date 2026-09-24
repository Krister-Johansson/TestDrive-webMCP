"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { parseLocalDay, toLocalDay } from "@/lib/booking-service";
import { cn } from "@/lib/utils";
import type { DaySummary } from "./day-summary";

export type SlotCalendarViewProps = {
  days: DaySummary[];
  selected: string;
  onSelectDay: (date: string) => void;
  className?: string;
};

/**
 * A month calendar of the car's schedule. Days with free slots are selectable, fully booked
 * days are struck through, days without slots are disabled.
 */
export function SlotCalendarView({ days, selected, onSelectDay, className }: SlotCalendarViewProps) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const selectedDate = parseLocalDay(selected);
  const [month, setMonth] = useState(selectedDate);
  const first = days[0] ? parseLocalDay(days[0].date) : selectedDate;
  const last = days.at(-1) ? parseLocalDay(days.at(-1)!.date) : selectedDate;
  const fullDays = days.filter((day) => day.available === 0).map((day) => parseLocalDay(day.date));

  return (
    <Calendar
      mode="single"
      required
      selected={selectedDate}
      onSelect={(date) => onSelectDay(toLocalDay(date))}
      month={month}
      onMonthChange={setMonth}
      startMonth={first}
      endMonth={last}
      showOutsideDays={false}
      weekStartsOn={1}
      disabled={(date) => {
        const day = byDate.get(toLocalDay(date));
        return !day || (day.available === 0 && toLocalDay(date) !== selected);
      }}
      modifiers={{ full: fullDays }}
      modifiersClassNames={{ full: "[&>button]:line-through [&>button]:text-muted-foreground" }}
      className={cn("rounded-xl border bg-card [--cell-size:--spacing(9)]", className)}
    />
  );
}
