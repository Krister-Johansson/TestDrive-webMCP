import type { BookingService, NewCar } from "@/lib/booking-service";
import { toLocalDay } from "@/lib/booking-service";

export const SEED_CARS: NewCar[] = [
  {
    brand: "Norra",
    model: "Fjell",
    year: 2026,
    bodyType: "suv",
    powertrain: "electric",
    transmission: "automatic",
    drivetrain: "awd",
    color: "White",
    seats: 7,
    towHitch: true,
    features: ["panoramic roof", "heated seats", "adaptive cruise", "360 camera"],
    tagline: "Seven seats, all-wheel drive, no tailpipe.",
  },
  {
    brand: "Norra",
    model: "Vik",
    year: 2025,
    bodyType: "wagon",
    powertrain: "plug-in-hybrid",
    transmission: "automatic",
    drivetrain: "awd",
    color: "Green",
    seats: 5,
    towHitch: true,
    features: ["roof rails", "heated seats", "head-up display"],
    tagline: "The long-distance wagon with a short commute in mind.",
  },
  {
    brand: "Norra",
    model: "Skog",
    year: 2024,
    bodyType: "sedan",
    powertrain: "hybrid",
    transmission: "automatic",
    drivetrain: "fwd",
    color: "Blue",
    seats: 5,
    towHitch: false,
    features: ["adaptive cruise", "wireless charging"],
    tagline: "Quiet, efficient, and very comfortable.",
  },
  {
    brand: "Aldo",
    model: "Cinque",
    year: 2023,
    bodyType: "hatchback",
    powertrain: "petrol",
    transmission: "manual",
    drivetrain: "fwd",
    color: "Red",
    seats: 4,
    towHitch: false,
    features: ["sport seats", "apple carplay"],
    tagline: "Small car, big grin.",
  },
  {
    brand: "Aldo",
    model: "Sera",
    year: 2026,
    bodyType: "coupe",
    powertrain: "petrol",
    transmission: "manual",
    drivetrain: "rwd",
    color: "Yellow",
    seats: 2,
    towHitch: false,
    features: ["sport seats", "limited-slip differential", "carbon roof"],
    tagline: "Two seats and a very good reason to take the long way home.",
  },
  {
    brand: "Kestrel",
    model: "Moor",
    year: 2025,
    bodyType: "suv",
    powertrain: "diesel",
    transmission: "manual",
    drivetrain: "awd",
    color: "Grey",
    seats: 5,
    towHitch: true,
    features: ["hill descent control", "roof rails", "heated steering wheel"],
    tagline: "Built for trailers, mud, and Monday mornings.",
  },
  {
    brand: "Kestrel",
    model: "Lane",
    year: 2026,
    bodyType: "wagon",
    powertrain: "electric",
    transmission: "automatic",
    drivetrain: "rwd",
    color: "Beige",
    seats: 5,
    towHitch: false,
    features: ["panoramic roof", "wireless charging", "360 camera"],
    tagline: "An electric estate with a boot that swallows everything.",
  },
  {
    brand: "Kestrel",
    model: "Heath",
    year: 2024,
    bodyType: "sedan",
    powertrain: "electric",
    transmission: "automatic",
    drivetrain: "awd",
    color: "Black",
    seats: 5,
    towHitch: true,
    features: ["heated seats", "head-up display", "adaptive cruise"],
    tagline: "Executive range, executive silence.",
  },
];

export type SeedOptions = {
  reset?: boolean;
  /** Which fleet to create. Tests use the fictional SEED_CARS; the app seeds the Volvo fleet. */
  cars?: NewCar[];
  days?: number;
  startHour?: number;
  endHour?: number;
  today?: Date;
};

export function seedDatabase(service: BookingService, options: SeedOptions = {}) {
  const existing = service.findCars({}, { includeInactive: true });
  if (existing.length > 0 && !options.reset) {
    return { cars: existing.length, slots: 0, skipped: true };
  }
  if (options.reset) {
    service.deleteAllCars();
  }
  const today = options.today ?? new Date();
  const from = toLocalDay(today);
  const last = new Date(today);
  last.setDate(last.getDate() + (options.days ?? 14) - 1);
  const to = toLocalDay(last);
  let slotCount = 0;
  const created = (options.cars ?? SEED_CARS).map((car) => service.createCar(car));
  for (const car of created) {
    slotCount += service.generateSlots({
      carId: car.id,
      from,
      to,
      startHour: options.startHour ?? 9,
      endHour: options.endHour ?? 17,
    }).length;
  }
  return { cars: created.length, slots: slotCount, skipped: false };
}
