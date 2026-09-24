"use client";

import { useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult } from "@/lib/actions";
import { countSlots, daysBetween } from "@/lib/slot-math";
import { toLocalDay } from "@/lib/booking-service";

export type SlotGeneratorInput = { car: string; from: string; to: string; startHour: number; endHour: number };

export type SlotGeneratorProps = {
  cars: { id: string; label: string }[];
  onSubmit: (input: SlotGeneratorInput) => Promise<ActionResult<{ count: number }>>;
};

const HOURS = Array.from({ length: 25 }, (_, hour) => hour);

export function SlotGenerator({ cars, onSubmit }: SlotGeneratorProps) {
  const today = toLocalDay(new Date());
  const [car, setCar] = useState(cars[0]?.id ?? "");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const days = daysBetween(from, to);
  const total = countSlots({ from, to, startHour, endHour });
  const carItems = cars.map((c) => ({ value: c.id, label: c.label }));
  const hourItems = (hours: number[]) => hours.map((h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:00` }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await onSubmit({ car, from, to, startHour, endHour });
      setMessage(
        result.ok
          ? { tone: "ok", text: `${result.data.count} slots added.` }
          : { tone: "error", text: result.error },
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field className="lg:col-span-2">
          <FieldLabel htmlFor="gen-car">Car</FieldLabel>
          <Select items={carItems} value={car} onValueChange={(v) => v && setCar(v)}>
            <SelectTrigger id="gen-car" aria-label="Car" className="w-full">
              <SelectValue placeholder="Pick a car" />
            </SelectTrigger>
            <SelectContent>
              {carItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="gen-from">From</FieldLabel>
          <Input id="gen-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="gen-to">To</FieldLabel>
          <Input id="gen-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field>
            <FieldLabel htmlFor="gen-start">Start hour</FieldLabel>
            <Select items={hourItems(HOURS.slice(0, 24))} value={String(startHour)} onValueChange={(v) => v && setStartHour(Number(v))}>
              <SelectTrigger id="gen-start" aria-label="Start hour" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hourItems(HOURS.slice(0, 24)).map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="gen-end">End hour</FieldLabel>
            <Select items={hourItems(HOURS.slice(1))} value={String(endHour)} onValueChange={(v) => v && setEndHour(Number(v))}>
              <SelectTrigger id="gen-end" aria-label="End hour" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hourItems(HOURS.slice(1)).map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {days === 0 ? "Pick a valid date range." : `${days} ${days === 1 ? "day" : "days"}, ${total} slots of 45 minutes.`}
        </p>
        <div className="flex items-center gap-3">
          {message ? (
            <span role="status" className={message.tone === "ok" ? "text-sm text-emerald-600 dark:text-emerald-400" : "text-sm text-destructive"}>
              {message.text}
            </span>
          ) : null}
          <Button type="submit" disabled={pending || total === 0 || !car}>
            <CalendarPlus aria-hidden="true" />
            {pending ? "Generating…" : "Generate slots"}
          </Button>
        </div>
      </div>
    </form>
  );
}
