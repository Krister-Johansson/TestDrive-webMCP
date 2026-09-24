import { parseLocalDay, toLocalDay, type BookingService } from "./booking-service";
import { isIsoDay } from "./dates";

/** Loads everything the car booking view needs: the car, its days, and the slots for the chosen day. */
export function loadBookingView(service: BookingService, carId: string, date: string | string[] | undefined) {
  const car = service.findCar(carId);
  if (!car || !car.active) return null;
  const days = service.listSlotDays(car.id);
  const today = toLocalDay(new Date());
  let requested: string | null = null;
  if (isIsoDay(date)) {
    try {
      parseLocalDay(date);
      requested = date;
    } catch {
      requested = null; // an impossible date such as 2026-02-30 falls back to the default day
    }
  }
  const selected = requested ?? days.find((day) => day.date >= today)?.date ?? days[0]?.date ?? today;
  const slots = service.listSlots({ carId: car.id, date: selected });
  return { car, days, selected, slots };
}

export type BookingView = NonNullable<ReturnType<typeof loadBookingView>>;
