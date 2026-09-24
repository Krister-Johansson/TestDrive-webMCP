"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { queryFrom, withQuery } from "@/lib/search-params";
import type { DaySummary } from "./day-summary";
import { SlotCalendarView } from "./slot-calendar-view";

/** The calendar wired to the URL: picking a day sets ?date= without adding a history entry. */
export function SlotCalendar({ carId, days, selected, query = "" }: { carId: string; days: DaySummary[]; selected: string; query?: string }) {
  const router = useRouter();
  return (
    <SlotCalendarView
      days={days}
      selected={selected}
      onSelectDay={(date) => {
        startTransition(() => {
          router.replace(withQuery(`/book/${carId}`, queryFrom(new URLSearchParams(query), { date })), { scroll: false });
        });
      }}
    />
  );
}
