"use client";

import { selectSlot } from "@/components/booking/booking-ui-store";
import type { Car } from "@/db/schema";
import type { SlotWithBooking } from "@/lib/booking-service";
import { formatSlotTime } from "@/lib/format";
import { TOOL_DEFS } from "@/lib/tool-defs";
import { WEBMCP_SCHEMAS } from "@/lib/webmcp-schemas";
import { toolError, useAppTool } from "./use-app-tool";

/** Tools that only make sense while a car's booking page is open. */
export function BookToolset({ car, slots }: { car: Car; slots: SlotWithBooking[] }) {
  useAppTool(
    TOOL_DEFS.select_slot,
    WEBMCP_SCHEMAS.select_slot,
    async (input) => {
      const slotId = typeof input.slotId === "string" ? input.slotId : "";
      const slot = slots.find((candidate) => candidate.id === slotId);
      if (!slot) return toolError(`Slot ${slotId || "(empty)"} is not on this page. Use list_available_slots for ${car.brand} ${car.model}.`);
      if (slot.booking) return toolError(`Slot ${slotId} at ${formatSlotTime(slot.startsAt)} is already booked.`);
      if (slot.past) return toolError(`Slot ${slotId} at ${formatSlotTime(slot.startsAt)} has already started.`);
      selectSlot(slot.id);
      return `Selected ${formatSlotTime(slot.startsAt)} for ${car.brand} ${car.model}. The confirmation form is open; book_test_drive with slotId ${slot.id} completes it.`;
    },
    [car.id, slots.map((slot) => `${slot.id}:${slot.booking ? 1 : 0}:${slot.past ? 1 : 0}`).join(",")],
  );
  return null;
}
