"use client";

import { resetBookingUi } from "@/components/booking/booking-ui-store";
import type { Car, Slot } from "@/db/schema";
import type { ActionResult } from "@/lib/actions";
import type { BookingDetail, NewBooking } from "@/lib/booking-service";
import { TOOL_DEFS } from "@/lib/tool-defs";
import { formatBooking, formatCars, formatSlots } from "@/lib/tool-output";
import { WEBMCP_SCHEMAS } from "@/lib/webmcp-schemas";
import { toolError, useAppTool } from "./use-app-tool";

export type GlobalToolActions = {
  findCars: (filters: Record<string, unknown>) => Promise<ActionResult<Car[]>>;
  listAvailableSlots: (input: { car: string; date: string }) => Promise<ActionResult<{ car: Car; slots: Slot[] }>>;
  getBooking: (bookingId: string) => Promise<ActionResult<BookingDetail | null>>;
  createBooking: (input: NewBooking) => Promise<ActionResult<BookingDetail>>;
  cancelBooking: (bookingId: string) => Promise<ActionResult<BookingDetail>>;
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Tools available on every page. They call the same server actions the UI uses. */
export function GlobalTools({ actions }: { actions: GlobalToolActions }) {
  useAppTool(TOOL_DEFS.find_cars, WEBMCP_SCHEMAS.find_cars, async (input) => {
    const result = await actions.findCars(input);
    return result.ok ? formatCars(result.data) : toolError(result.error);
  });

  useAppTool(TOOL_DEFS.list_available_slots, WEBMCP_SCHEMAS.list_available_slots, async (input) => {
    const result = await actions.listAvailableSlots({ car: str(input.car), date: str(input.date) });
    return result.ok ? formatSlots(result.data.car, str(input.date), result.data.slots) : toolError(result.error);
  });

  useAppTool(TOOL_DEFS.get_booking, WEBMCP_SCHEMAS.get_booking, async (input) => {
    const result = await actions.getBooking(str(input.bookingId));
    if (!result.ok) return toolError(result.error);
    return result.data ? formatBooking(result.data) : toolError(`Booking ${str(input.bookingId)} was not found.`);
  });

  useAppTool(TOOL_DEFS.book_test_drive, WEBMCP_SCHEMAS.book_test_drive, async (input) => {
    const result = await actions.createBooking({
      slotId: str(input.slotId),
      customerName: str(input.customerName),
      customerEmail: typeof input.customerEmail === "string" ? input.customerEmail : undefined,
      note: typeof input.note === "string" ? input.note : undefined,
    });
    if (!result.ok) return toolError(result.error);
    // If the confirmation sheet was open for this slot, close it: the booking is done.
    resetBookingUi();
    return formatBooking(result.data);
  });

  useAppTool(TOOL_DEFS.cancel_booking, WEBMCP_SCHEMAS.cancel_booking, async (input) => {
    const result = await actions.cancelBooking(str(input.bookingId));
    return result.ok ? formatBooking(result.data) : toolError(result.error);
  });

  return null;
}
