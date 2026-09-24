import { createDb } from "@/db";
import { seedDatabase } from "@/db/seed";
import { createBookingService } from "@/lib/booking-service";
import { createEventBus } from "@/lib/events";
import { E2E_DB_FILE } from "./config";

/** Resets the e2e database to the seed fleet. Safe to call while the dev server is running. */
export function reseed() {
  const service = createBookingService(createDb(E2E_DB_FILE), createEventBus());
  return seedDatabase(service, { reset: true, days: 7, startHour: 9, endHour: 17 });
}
