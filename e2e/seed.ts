import { createDb } from "@/db";
import { seedDatabase } from "@/db/seed";
import { createBookingService } from "@/lib/booking-service";
import { createEventBus } from "@/lib/events";
import { E2E_DB_FILE } from "./config";

/**
 * Resets the e2e database to the seed fleet. Safe to call while the dev server is running.
 * Slots start tomorrow: late in the day, today's last free slot would be the first one a test
 * books, the day would sell out, and the calendar would jump to the next day mid-test.
 */
export function reseed() {
  const service = createBookingService(createDb(E2E_DB_FILE), createEventBus());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return seedDatabase(service, { reset: true, days: 7, startHour: 9, endHour: 17, today: tomorrow });
}
