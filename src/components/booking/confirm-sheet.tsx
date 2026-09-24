"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { CalendarCheck, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Car, Slot } from "@/db/schema";
import type { ActionResult } from "@/lib/actions";
import type { BookingDetail, NewBooking } from "@/lib/booking-service";
import { carName, formatLongDate, formatTime } from "@/lib/format";

export type ConfirmSheetProps = {
  car: Car;
  slot: Slot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submit: (input: NewBooking) => Promise<ActionResult<BookingDetail>>;
  onBooked?: (booking: BookingDetail) => void;
};

export function ConfirmSheet({ car, slot, open, onOpenChange, submit, onBooked }: ConfirmSheetProps) {
  const [booked, setBooked] = useState<BookingDetail | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) setBooked(null);
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        {booked ? (
          <BookedView booking={booked} onDone={() => handleOpenChange(false)} />
        ) : (
          <ConfirmForm
            car={car}
            slot={slot}
            submit={submit}
            onBooked={(booking) => {
              setBooked(booking);
              onBooked?.(booking);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function BookedView({ booking, onDone }: { booking: BookingDetail; onDone: () => void }) {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <LazyMotion features={domAnimation} strict>
        <m.div
          initial={reduced ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        >
          <Check className="size-8" aria-hidden="true" />
        </m.div>
      </LazyMotion>
      <SheetTitle className="text-xl">Booked!</SheetTitle>
      <SheetDescription className="text-base">
        {carName(booking.car)} on {formatLongDate(booking.slot.startsAt)} at {formatTime(booking.slot.startsAt)}.
      </SheetDescription>
      <p className="text-xs text-muted-foreground">Booking id {booking.id}</p>
      <div className="mt-2 flex gap-2">
        <Link href={`/bookings/${booking.id}`} className={buttonVariants()}>
          View booking
        </Link>
        <Button variant="outline" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}

function ConfirmForm({
  car,
  slot,
  submit,
  onBooked,
}: {
  car: Car;
  slot: Slot | null;
  submit: ConfirmSheetProps["submit"];
  onBooked: (booking: BookingDetail) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slot) return;
    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }
    setNameError(null);
    setServerError(null);
    startTransition(async () => {
      const result = await submit({ slotId: slot.id, customerName: name.trim(), customerEmail: email, note });
      if (result.ok) {
        onBooked(result.data);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col" noValidate>
      <SheetHeader>
        <SheetTitle>Confirm your test drive</SheetTitle>
        <SheetDescription>
          {carName(car)}
          {slot ? (
            <>
              {" "}
              on {formatLongDate(slot.startsAt)} at <span className="font-medium text-foreground">{formatTime(slot.startsAt)}</span>,
              45 minutes.
            </>
          ) : null}
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-4 px-4">
        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor="confirm-name">Name</FieldLabel>
          <Input
            id="confirm-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={nameError ? true : undefined}
            placeholder="Your full name"
          />
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-email">Email (optional)</FieldLabel>
          <Input
            id="confirm-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-note">Note (optional)</FieldLabel>
          <Textarea
            id="confirm-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the dealership should know"
            rows={3}
          />
        </Field>
        {serverError ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        ) : null}
      </div>
      <SheetFooter className="mt-auto">
        <Button type="submit" disabled={pending || !slot} className="w-full">
          <CalendarCheck aria-hidden="true" />
          {pending ? "Booking…" : "Confirm booking"}
        </Button>
      </SheetFooter>
    </form>
  );
}
