"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import type { Car } from "@/db/schema";
import { createBookingAction } from "@/lib/actions";
import type { SlotWithBooking } from "@/lib/booking-service";
import { resetBookingUi, selectSlot, setSheetOpen, useBookingUi } from "./booking-ui-store";
import { ConfirmSheet } from "./confirm-sheet";
import { SlotGrid } from "./slot-grid";

export function BookingPanel({ car, slots }: { car: Car; slots: SlotWithBooking[] }) {
  const router = useRouter();
  const { selectedSlotId, sheetOpen } = useBookingUi();
  const selected = slots.find((slot) => slot.id === selectedSlotId) ?? null;

  useEffect(() => resetBookingUi, []);

  return (
    <>
      <SlotGrid slots={slots} selectedId={selectedSlotId} onSelect={(slot) => selectSlot(slot.id)} />
      <ConfirmSheet
        car={car}
        slot={selected}
        open={sheetOpen && selected !== null}
        onOpenChange={setSheetOpen}
        submit={createBookingAction}
        onBooked={() => startTransition(() => router.refresh())}
      />
    </>
  );
}
