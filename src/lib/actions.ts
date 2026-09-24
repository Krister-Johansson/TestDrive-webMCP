"use server";

import { revalidatePath } from "next/cache";
import {
  BookingServiceError,
  type BookingDetail,
  type BrandTree,
  type CarPatch,
  type GenerateSlotsInput,
  type NewBooking,
  type NewCar,
} from "./booking-service";
import { CarFilterError, parseCarFilters } from "./car-filters";
import { getBookingService } from "./service";
import type { Brand, Car, Model, Slot } from "@/db/schema";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code: string };

function run<T>(fn: () => T): ActionResult<T> {
  try {
    return { ok: true, data: fn() };
  } catch (error) {
    if (error instanceof BookingServiceError) {
      return { ok: false, error: error.message, code: error.code };
    }
    if (error instanceof CarFilterError) {
      return { ok: false, error: error.message, code: "validation" };
    }
    console.error(error);
    return { ok: false, error: "Something went wrong. Try again.", code: "unknown" };
  }
}

/** Invalidate only the routes that render the changed data. */
function revalidateFor(scope: { carId?: string; bookingId?: string; fleet?: boolean } = {}) {
  revalidatePath("/");
  revalidatePath("/admin");
  if (scope.fleet) revalidatePath("/book/[carId]", "page");
  if (scope.carId) revalidatePath(`/book/${scope.carId}`);
  if (scope.bookingId) revalidatePath(`/bookings/${scope.bookingId}`);
}

export async function findCarsAction(filters: Record<string, unknown>): Promise<ActionResult<Car[]>> {
  return run(() => getBookingService().findCars(parseCarFilters(filters)));
}

export async function findCarAction(query: string): Promise<ActionResult<Car | null>> {
  return run(() => getBookingService().findCar(query));
}

export async function listAvailableSlotsAction(input: {
  car: string;
  date: string;
}): Promise<ActionResult<{ car: Car; slots: Slot[] }>> {
  return run(() => {
    const service = getBookingService();
    const car = service.findCar(input.car);
    if (!car) throw new BookingServiceError(`No car matches "${input.car}".`, "not_found");
    return { car, slots: service.listAvailableSlots({ carId: car.id, date: input.date }) };
  });
}

export async function createBookingAction(input: NewBooking): Promise<ActionResult<BookingDetail>> {
  const result = run(() => {
    const service = getBookingService();
    const booking = service.createBooking(input);
    return service.getBooking(booking.id)!;
  });
  if (result.ok) revalidateFor({ carId: result.data.car.id, bookingId: result.data.id });
  return result;
}

export async function cancelBookingAction(bookingId: string): Promise<ActionResult<BookingDetail>> {
  const result = run(() => {
    const service = getBookingService();
    service.cancelBooking(bookingId);
    return service.getBooking(bookingId)!;
  });
  if (result.ok) revalidateFor({ carId: result.data.car.id, bookingId });
  return result;
}

export async function getBookingAction(bookingId: string): Promise<ActionResult<BookingDetail | null>> {
  return run(() => getBookingService().getBooking(bookingId));
}

export async function listBookingsAction(input: {
  status?: "confirmed" | "cancelled";
} = {}): Promise<ActionResult<BookingDetail[]>> {
  return run(() => getBookingService().listBookings(input));
}

export async function listBrandsAction(): Promise<ActionResult<BrandTree[]>> {
  return run(() => getBookingService().listBrands());
}

export async function addModelAction(brandName: string, modelName: string): Promise<ActionResult<{ brandId: string; modelId: string }>> {
  const result = run(() => {
    const { brandId, modelId } = getBookingService().addModel(brandName, modelName);
    return { brandId, modelId };
  });
  if (result.ok) revalidateFor({ fleet: true });
  return result;
}

export async function createBrandAction(name: string): Promise<ActionResult<Brand>> {
  const result = run(() => getBookingService().createBrand(name));
  if (result.ok) revalidateFor({ fleet: true });
  return result;
}

export async function createModelAction(brandId: string, name: string): Promise<ActionResult<Model>> {
  const result = run(() => getBookingService().createModel(brandId, name));
  if (result.ok) revalidateFor({ fleet: true });
  return result;
}

export async function createCarAction(input: NewCar): Promise<ActionResult<Car>> {
  const result = run(() => getBookingService().createCar(input));
  if (result.ok) revalidateFor({ fleet: true });
  return result;
}

export async function updateCarAction(id: string, patch: CarPatch): Promise<ActionResult<Car>> {
  const result = run(() => getBookingService().updateCar(id, patch));
  if (result.ok) revalidateFor({ carId: id });
  return result;
}

export async function generateSlotsAction(
  input: Omit<GenerateSlotsInput, "carId"> & { car: string },
): Promise<ActionResult<{ car: Car; count: number }>> {
  const result = run(() => {
    const service = getBookingService();
    const car = service.findCar(input.car);
    if (!car) throw new BookingServiceError(`No car matches "${input.car}".`, "not_found");
    const created = service.generateSlots({ ...input, carId: car.id });
    return { car, count: created.length };
  });
  if (result.ok) revalidateFor({ carId: result.data.car.id });
  return result;
}

export async function deleteSlotAction(slotId: string): Promise<ActionResult<null>> {
  const result = run(() => {
    getBookingService().deleteSlot(slotId);
    return null;
  });
  if (result.ok) revalidateFor({ fleet: true });
  return result;
}
