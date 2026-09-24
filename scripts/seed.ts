import { createDb, defaultDbFile } from "@/db";
import { DEMO_CARS } from "@/db/fleet";
import { seedDatabase } from "@/db/seed";
import { createBookingService } from "@/lib/booking-service";
import { createEventBus } from "@/lib/events";

const reset = process.argv.includes("--reset");
const file = defaultDbFile();
const service = createBookingService(createDb(file), createEventBus());
const result = seedDatabase(service, { reset, cars: DEMO_CARS });
if (result.skipped) {
  console.log(`Database at ${file} already has ${result.cars} cars. Run with --reset to reseed.`);
} else {
  console.log(`Seeded ${result.cars} cars and ${result.slots} slots into ${file}.`);
}
