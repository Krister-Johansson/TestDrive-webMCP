"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import type { SlotWithBooking } from "@/lib/booking-service";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type SlotGridProps = {
  slots: SlotWithBooking[];
  selectedId: string | null;
  onSelect: (slot: SlotWithBooking) => void;
};

function partOfDay(startsAt: number): "Morning" | "Afternoon" | "Evening" {
  const hour = new Date(startsAt).getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function SlotGrid({ slots, selectedId, onSelect }: SlotGridProps) {
  const reduced = useReducedMotion();
  if (slots.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No slots on this day. Pick another day in the calendar.
      </p>
    );
  }
  const groups = ["Morning", "Afternoon", "Evening"]
    .map((label) => ({ label, slots: slots.filter((slot) => partOfDay(slot.startsAt) === label) }))
    .filter((group) => group.slots.length > 0);
  // Stagger order across groups, computed up front so render stays free of mutation.
  const staggerIndex = new Map(slots.map((slot, index) => [slot.id, index]));
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.label} aria-label={group.label} className="space-y-2">
            <h4 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {group.label}
              <span className="ml-1.5 font-normal normal-case tracking-normal">
                {group.slots.filter((slot) => !slot.booking && !slot.past).length} free
              </span>
            </h4>
            <ul className="grid grid-cols-2 gap-2" aria-label={`${group.label} slots`}>
              {group.slots.map((slot) => {
                const booked = slot.booking !== null;
                const unavailable = booked || slot.past;
                const selected = slot.id === selectedId;
                const delay = reduced ? 0 : Math.min((staggerIndex.get(slot.id) ?? 0) * 0.02, 0.3);
                return (
                  <m.li
                    key={slot.id}
                    initial={reduced ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay, duration: 0.2 }}
                  >
                    <button
                      type="button"
                      disabled={unavailable}
                      aria-pressed={selected}
                      onClick={() => onSelect(slot)}
                      data-slot-id={slot.id}
                      className={cn(
                        "flex h-11 w-full items-center justify-between rounded-lg border px-3 text-sm transition-all duration-150",
                        "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        unavailable
                          ? "cursor-not-allowed border-transparent bg-muted/60 text-muted-foreground"
                          : "bg-card hover:border-foreground/40 hover:bg-accent/40",
                        selected && "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary",
                      )}
                    >
                      <span className="tabular-nums">
                        <span className={cn("font-medium", booked && "line-through")}>{formatTime(slot.startsAt)}</span>{" "}
                        <span className={cn("text-xs", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          to {formatTime(slot.endsAt)}
                        </span>
                      </span>
                      {unavailable ? (
                        <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                          {booked ? "Booked" : "Past"}
                        </span>
                      ) : selected ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : null}
                    </button>
                  </m.li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </LazyMotion>
  );
}
