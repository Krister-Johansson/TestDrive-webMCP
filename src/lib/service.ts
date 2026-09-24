import { getDb } from "@/db";
import { createBookingService, type BookingService } from "./booking-service";
import { getEventBus } from "./events";

/**
 * The database handle and event bus are process singletons. The service itself is
 * cheap closures over them, so it is rebuilt per call and survives hot reloads.
 */
export function getBookingService(): BookingService {
  return createBookingService(getDb(), getEventBus());
}
