import type { BookingService } from "./booking-service";
import { EVENT_TYPES, type DomainEvent, type DomainEventType } from "./events";
import { formatSlotTime } from "./format";

export type LiveEvent = DomainEvent & { label: string };

export function enrichEvent(service: BookingService, event: DomainEvent): LiveEvent {
  switch (event.type) {
    case "booking.created":
    case "booking.cancelled": {
      const detail = service.getBooking(event.payload.bookingId);
      const verb = event.type === "booking.created" ? "was just booked" : "was cancelled";
      if (!detail) return { ...event, label: `A test drive ${verb}.` };
      const car = `${detail.car.brand} ${detail.car.model}`;
      return { ...event, label: `${car}, ${formatSlotTime(detail.slot.startsAt)} ${verb}.` };
    }
    case "slots.generated":
      return { ...event, label: `${event.payload.count} new slots were added.` };
    case "slot.deleted":
      return { ...event, label: "A slot was removed." };
    case "car.created": {
      const car = service.findCar(event.payload.carId);
      return { ...event, label: car ? `${car.brand} ${car.model} joined the fleet.` : "A car was added." };
    }
    case "car.updated": {
      const car = service.findCar(event.payload.carId);
      return { ...event, label: car ? `${car.brand} ${car.model} was updated.` : "A car was updated." };
    }
  }
}

export function parseLiveEvent(raw: string): LiveEvent | null {
  try {
    const value = JSON.parse(raw) as Partial<LiveEvent>;
    if (!value || typeof value !== "object") return null;
    if (!EVENT_TYPES.includes(value.type as DomainEventType)) return null;
    if (!value.payload || typeof value.payload !== "object") return null;
    return {
      type: value.type,
      payload: value.payload,
      at: typeof value.at === "number" ? value.at : Date.now(),
      label: typeof value.label === "string" ? value.label : "",
    } as LiveEvent;
  } catch {
    return null;
  }
}
