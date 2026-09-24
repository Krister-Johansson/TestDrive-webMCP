import type { Car, Slot } from "@/db/schema";
import type { BookingDetail, BrandTree } from "./booking-service";
import { ENUM_LABELS } from "./car-enums";
import { formatLongDate, formatTime } from "./format";
import { TOOL_LIMITS } from "./tool-defs";

export function carLine(car: Car): string {
  const bits = [
    `${car.brand} ${car.model} (${car.year})`,
    ENUM_LABELS.bodyType[car.bodyType],
    ENUM_LABELS.powertrain[car.powertrain],
    ENUM_LABELS.transmission[car.transmission],
    car.drivetrain.toUpperCase(),
    car.color,
    `${car.seats} seats`,
    car.towHitch ? "tow hitch" : "no tow hitch",
  ];
  const features = car.features.length ? ` Features: ${car.features.join(", ")}.` : "";
  return `- id ${car.id}: ${bits.join(", ")}.${features}`;
}

export function formatCars(cars: Car[]): string {
  if (cars.length === 0) return "No cars match those filters. Try fewer filters.";
  return clamp(`${cars.length} car${cars.length === 1 ? "" : "s"}:\n${cars.map(carLine).join("\n")}`);
}

export function formatSlots(car: Car, date: string, slots: Slot[]): string {
  const name = `${car.brand} ${car.model}`;
  if (slots.length === 0) return `No free slots for ${name} on ${date}. Try another day.`;
  const lines = slots.map((slot) => `- slot ${slot.id}: ${formatTime(slot.startsAt)} to ${formatTime(slot.endsAt)}`);
  return clamp(`${slots.length} free slot${slots.length === 1 ? "" : "s"} for ${name} on ${date}:\n${lines.join("\n")}`);
}

export function formatBooking(booking: BookingDetail): string {
  const car = `${booking.car.brand} ${booking.car.model}`;
  const when = `${formatLongDate(booking.slot.startsAt)} at ${formatTime(booking.slot.startsAt)}`;
  const extras = [
    booking.customerEmail ? `email ${booking.customerEmail}` : null,
    booking.note ? `note "${booking.note}"` : null,
  ].filter(Boolean);
  return `Booking ${booking.id} is ${booking.status}: ${car}, ${when}, for ${booking.customerName}${extras.length ? ` (${extras.join(", ")})` : ""}.`;
}

export function formatBookings(bookings: BookingDetail[]): string {
  if (bookings.length === 0) return "There are no bookings yet.";
  const lines = bookings
    .slice(0, 20)
    .map(
      (b) =>
        `- ${b.id}: ${b.status}, ${b.car.brand} ${b.car.model}, ${formatLongDate(b.slot.startsAt)} ${formatTime(b.slot.startsAt)}, ${b.customerName}`,
    );
  const more = bookings.length > 20 ? `\n…and ${bookings.length - 20} more.` : "";
  return clamp(`${bookings.length} booking${bookings.length === 1 ? "" : "s"}, newest first:\n${lines.join("\n")}${more}`);
}

export function formatBrands(tree: BrandTree[]): string {
  if (tree.length === 0) return "No brands yet. Use add_model to create one.";
  const lines = tree.map((brand) => `- ${brand.name}: ${brand.models.map((m) => m.name).join(", ") || "(no models)"}`);
  return clamp(`${tree.length} brand${tree.length === 1 ? "" : "s"}:\n${lines.join("\n")}`);
}

export function clamp(text: string, limit = TOOL_LIMITS.output): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}
