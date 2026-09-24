import { and, asc, desc, eq, gte, inArray, like, lt, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Db } from "@/db";
import { bookings, brands, carImages, cars, models, slots, type Booking, type Brand, type Car, type CarImage, type CarRow, type Model, type Slot } from "@/db/schema";
import {
  BODY_TYPES,
  COLOR_NAMES,
  DRIVETRAINS,
  POWERTRAINS,
  SLOT_DURATION_MINUTES,
  TRANSMISSIONS,
  colorHex,
  type BookingStatus,
  type CarColor,
} from "./car-enums";
import type { CarFilters } from "./car-filters";
import type { EventBus } from "./events";
import { ISO_DAY_PATTERN } from "./dates";
import { daysBetween, slotStartsForDay } from "./slot-math";

export class BookingServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
export class NotFoundError extends BookingServiceError {
  constructor(what: string) {
    super(`${what} was not found.`, "not_found");
  }
}
export class SlotTakenError extends BookingServiceError {
  constructor() {
    super("That slot was just booked by someone else. Pick another slot.", "slot_taken");
  }
}
export class BookingStateError extends BookingServiceError {
  constructor(message: string) {
    super(message, "invalid_state");
  }
}
export class ValidationError extends BookingServiceError {
  constructor(message: string) {
    super(message, "validation");
  }
}

export type NewCarImage = { url: string; credit?: string; sourceUrl?: string | null };
export type NewCar = Omit<CarRow, "id" | "createdAt" | "active" | "features" | "tagline" | "modelId"> & {
  brand: string;
  model: string;
  features?: string[];
  tagline?: string;
  active?: boolean;
  /** Photos in display order. Replaces the whole list on update. */
  images?: NewCarImage[];
};
export type CarPatch = Partial<Omit<NewCar, "active"> & { active: boolean }>;
export type BrandTree = { id: string; name: string; models: { id: string; name: string }[] };
export type Facet = { value: string; count: number };
/** Values still available for each filter, given the other active filters. */
export type FacetOptions = {
  brand: Facet[];
  model: Facet[];
  bodyType: Facet[];
  powertrain: Facet[];
  transmission: Facet[];
  drivetrain: Facet[];
  color: Facet[];
  seats: number[];
  years: number[];
  towHitch: boolean;
};

export type GenerateSlotsInput = {
  carId: string;
  from: string;
  to: string;
  startHour: number;
  endHour: number;
  durationMinutes?: number;
};

export type SlotWithBooking = Slot & {
  booking: { id: string; customerName: string } | null;
  /** True once the slot's start time has passed; such slots cannot be booked. */
  past: boolean;
};

export const MAX_SLOT_RANGE_DAYS = 366;

export type BookingServiceOptions = {
  /** Clock, injectable for tests. */
  now?: () => number;
};

export type NewBooking = {
  slotId: string;
  customerName: string;
  customerEmail?: string | null;
  note?: string | null;
};

export type BookingDetail = Booking & { slot: Slot; car: Car };

export function parseLocalDay(day: string): Date {
  if (!ISO_DAY_PATTERN.test(day)) {
    throw new ValidationError(`Expected a date formatted YYYY-MM-DD, got "${day}".`);
  }
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime()) || date.getMonth() !== m - 1) {
    throw new ValidationError(`"${day}" is not a valid calendar day.`);
  }
  return date;
}

function dayRange(day: string): { start: number; end: number } {
  const start = parseLocalDay(day);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.getTime(), end: end.getTime() };
}

function contains(column: Parameters<typeof like>[0], value: string) {
  const escaped = value.toLowerCase().replaceAll("%", "\\%").replaceAll("_", "\\_");
  return sql`lower(${column}) like ${`%${escaped}%`} escape '\\'`;
}

export function createBookingService(db: Db, bus: EventBus, options: BookingServiceOptions = {}) {
  const now = options.now ?? Date.now;
  function transaction<T>(fn: () => T): T {
    db.$client.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.$client.exec("COMMIT");
      return result;
    } catch (error) {
      db.$client.exec("ROLLBACK");
      throw error;
    }
  }

  const carColumns = {
    id: cars.id,
    modelId: cars.modelId,
    year: cars.year,
    bodyType: cars.bodyType,
    powertrain: cars.powertrain,
    transmission: cars.transmission,
    drivetrain: cars.drivetrain,
    color: cars.color,
    seats: cars.seats,
    towHitch: cars.towHitch,
    features: cars.features,
    tagline: cars.tagline,
    active: cars.active,
    createdAt: cars.createdAt,
    brandId: brands.id,
    brand: brands.name,
    model: models.name,
  };

  function carQuery() {
    return db
      .select(carColumns)
      .from(cars)
      .innerJoin(models, eq(models.id, cars.modelId))
      .innerJoin(brands, eq(brands.id, models.brandId));
  }

  function imagesFor(carIds: string[]): Map<string, CarImage[]> {
    const map = new Map<string, CarImage[]>();
    if (carIds.length === 0) return map;
    const rows = db
      .select()
      .from(carImages)
      .where(inArray(carImages.carId, carIds))
      .orderBy(asc(carImages.carId), asc(carImages.sortOrder))
      .all();
    for (const row of rows) map.set(row.carId, [...(map.get(row.carId) ?? []), row]);
    return map;
  }

  function toCars(rows: Omit<Car, "colorHex" | "images">[]): Car[] {
    const images = imagesFor(rows.map((row) => row.id));
    return rows.map((row) => ({ ...row, colorHex: colorHex(row.color), images: images.get(row.id) ?? [] }));
  }

  function toCar(row: Omit<Car, "colorHex" | "images">): Car {
    return toCars([row])[0];
  }

  function validateImages(images: NewCarImage[]) {
    for (const image of images) {
      if (!/^(https?:\/\/|\/)/.test(image.url)) {
        throw new ValidationError(`Image URL must start with http://, https://, or / for a local file, got "${image.url}".`);
      }
    }
  }

  function replaceImages(carId: string, images: NewCarImage[]) {
    db.delete(carImages).where(eq(carImages.carId, carId)).run();
    images.forEach((image, index) => {
      db.insert(carImages)
        .values({
          id: nanoid(10),
          carId,
          url: image.url,
          credit: image.credit ?? "",
          sourceUrl: image.sourceUrl ?? null,
          sortOrder: index,
          createdAt: Date.now(),
        })
        .run();
    });
  }

  function requireCar(id: string): Car {
    const car = carQuery().where(eq(cars.id, id)).get();
    if (!car) throw new NotFoundError(`Car ${id}`);
    return toCar(car);
  }

  function listBrands(): BrandTree[] {
    const brandRows = db.select().from(brands).orderBy(asc(brands.name)).all();
    const modelRows = db.select().from(models).orderBy(asc(models.name)).all();
    const byBrand = new Map<string, { id: string; name: string }[]>();
    for (const model of modelRows) {
      const list = byBrand.get(model.brandId) ?? [];
      list.push({ id: model.id, name: model.name });
      byBrand.set(model.brandId, list);
    }
    return brandRows.map((brand) => ({ id: brand.id, name: brand.name, models: byBrand.get(brand.id) ?? [] }));
  }

  function findBrand(name: string): Brand | null {
    const wanted = name.trim().toLowerCase();
    if (!wanted) return null;
    return db.select().from(brands).all().find((brand) => brand.name.toLowerCase() === wanted) ?? null;
  }

  function createBrand(name: string): Brand {
    const trimmed = name.trim();
    if (!trimmed) throw new ValidationError("Brand name is required.");
    if (findBrand(trimmed)) throw new ValidationError(`Brand "${trimmed}" already exists.`);
    const brand: Brand = { id: nanoid(10), name: trimmed, createdAt: Date.now() };
    db.insert(brands).values(brand).run();
    bus.emit({ type: "car.updated", payload: { carId: "" } });
    return brand;
  }

  function findModel(brandId: string, name: string): Model | null {
    const wanted = name.trim().toLowerCase();
    if (!wanted) return null;
    return (
      db
        .select()
        .from(models)
        .where(eq(models.brandId, brandId))
        .all()
        .find((model) => model.name.toLowerCase() === wanted) ?? null
    );
  }

  function createModel(brandId: string, name: string): Model {
    const trimmed = name.trim();
    if (!trimmed) throw new ValidationError("Model name is required.");
    const brand = db.select().from(brands).where(eq(brands.id, brandId)).get();
    if (!brand) throw new NotFoundError(`Brand ${brandId}`);
    if (findModel(brandId, trimmed)) throw new ValidationError(`${brand.name} already has a model "${trimmed}".`);
    const model: Model = { id: nanoid(10), brandId, name: trimmed, createdAt: Date.now() };
    db.insert(models).values(model).run();
    bus.emit({ type: "car.updated", payload: { carId: "" } });
    return model;
  }

  /** Finds or creates the brand and model for a pair of names. */
  function resolveModel(brandName: string, modelName: string): Model {
    const brand = findBrand(brandName) ?? createBrand(brandName);
    return findModel(brand.id, modelName) ?? createModel(brand.id, modelName);
  }

  /** The joined car rows for a filter, without images. Facets use this directly. */
  function queryCars(filters: CarFilters = {}, options: { includeInactive?: boolean } = {}) {
    const conditions = [];
    if (!options.includeInactive) conditions.push(eq(cars.active, true));
    if (filters.brand) conditions.push(contains(brands.name, filters.brand));
    if (filters.model) conditions.push(contains(models.name, filters.model));
    if (filters.bodyType) conditions.push(eq(cars.bodyType, filters.bodyType));
    if (filters.powertrain) conditions.push(eq(cars.powertrain, filters.powertrain));
    if (filters.transmission) conditions.push(eq(cars.transmission, filters.transmission));
    if (filters.drivetrain) conditions.push(eq(cars.drivetrain, filters.drivetrain));
    if (filters.color) conditions.push(eq(cars.color, filters.color));
    if (filters.minSeats !== undefined) conditions.push(gte(cars.seats, filters.minSeats));
    if (filters.towHitch !== undefined) conditions.push(eq(cars.towHitch, filters.towHitch));
    if (filters.yearFrom !== undefined) conditions.push(gte(cars.year, filters.yearFrom));
    if (filters.yearTo !== undefined) conditions.push(lte(cars.year, filters.yearTo));
    if (filters.feature) conditions.push(contains(cars.features, filters.feature));
    return carQuery()
      .where(and(...conditions))
      .orderBy(asc(brands.name), asc(models.name))
      .all();
  }

  function findCars(filters: CarFilters = {}, options: { includeInactive?: boolean } = {}): Car[] {
    return toCars(queryCars(filters, options));
  }

  /**
   * Faceted options: for each filter, count the cars that match every *other* active
   * filter. Brand ignores the model filter as well, since a model belongs to a brand.
   */
  function filterOptions(filters: CarFilters = {}): FacetOptions {
    type Row = ReturnType<typeof queryCars>[number];
    const without = (...keys: (keyof CarFilters)[]) => {
      const rest: CarFilters = { ...filters };
      for (const key of keys) delete rest[key];
      return queryCars(rest);
    };
    const facet = (rows: Row[], pick: (car: Row) => string, order?: readonly string[]): Facet[] => {
      const counts = new Map<string, number>();
      for (const car of rows) counts.set(pick(car), (counts.get(pick(car)) ?? 0) + 1);
      const values = [...counts.entries()].map(([value, count]) => ({ value, count }));
      if (!order) return values.sort((a, b) => a.value.localeCompare(b.value));
      const rank = new Map(order.map((value, index) => [value, index]));
      return values.sort((a, b) => (rank.get(a.value) ?? 0) - (rank.get(b.value) ?? 0));
    };
    const others = without();
    const brandRows = without("brand", "model");
    const modelRows = filters.brand ? without("model") : [];
    return {
      brand: facet(brandRows, (car) => car.brand),
      model: facet(modelRows, (car) => car.model),
      bodyType: facet(without("bodyType"), (car) => car.bodyType, BODY_TYPES),
      powertrain: facet(without("powertrain"), (car) => car.powertrain, POWERTRAINS),
      transmission: facet(without("transmission"), (car) => car.transmission, TRANSMISSIONS),
      drivetrain: facet(without("drivetrain"), (car) => car.drivetrain, DRIVETRAINS),
      color: facet(without("color"), (car) => car.color, COLOR_NAMES),
      seats: [...new Set(without("minSeats").map((car) => car.seats))].sort((a, b) => a - b),
      years: [...new Set(without("yearFrom", "yearTo").map((car) => car.year))].sort((a, b) => a - b),
      towHitch: without("towHitch").some((car) => car.towHitch) || others.length === 0,
    };
  }

  function findCar(idOrName: string, options: { includeInactive?: boolean } = {}): Car | null {
    const query = idOrName.trim();
    if (!query) return null;
    const active = options.includeInactive ? undefined : eq(cars.active, true);
    const lowered = query.toLowerCase();
    const fullName = sql`lower(${brands.name} || ' ' || ${models.name})`;
    // Exact id, then exact "Brand Model", then exact model, then a substring of "Brand Model".
    const attempts = [
      eq(cars.id, query),
      eq(fullName, lowered),
      eq(sql`lower(${models.name})`, lowered),
      like(fullName, `%${lowered.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`),
    ];
    for (const condition of attempts) {
      const row = carQuery()
        .where(and(condition, active))
        .orderBy(desc(cars.active), asc(brands.name), asc(models.name))
        .get();
      if (row) return toCar(row);
    }
    return null;
  }

  function addModel(brandName: string, modelName: string): { brandId: string; modelId: string; brand: string; model: string } {
    const brand = findBrand(brandName) ?? createBrand(brandName);
    const model = createModel(brand.id, modelName);
    return { brandId: brand.id, modelId: model.id, brand: brand.name, model: model.name };
  }

  function createCar(input: NewCar): Car {
    const { brand, model, images, ...rest } = input;
    validateCarFields({ ...rest, brand, model });
    validateImages(images ?? []);
    const car = transaction(() => {
      const resolved = resolveModel(brand, model);
      const row: CarRow = {
        ...rest,
        id: nanoid(10),
        modelId: resolved.id,
        features: rest.features ?? [],
        tagline: rest.tagline ?? "",
        active: rest.active ?? true,
        createdAt: Date.now(),
      };
      db.insert(cars).values(row).run();
      replaceImages(row.id, images ?? []);
      return row.id;
    });
    bus.emit({ type: "car.created", payload: { carId: car } });
    return requireCar(car);
  }

  function updateCar(id: string, patch: CarPatch): Car {
    const current = requireCar(id);
    const { brand, model, images, ...rest } = patch;
    validateCarFields({ ...current, ...rest, brand: brand ?? current.brand, model: model ?? current.model });
    if (images) validateImages(images);
    transaction(() => {
      if (images) replaceImages(id, images);
      const values: Partial<CarRow> = { ...rest };
      if (brand !== undefined || model !== undefined) {
        values.modelId = resolveModel(brand ?? current.brand, model ?? current.model).id;
      }
      if (Object.keys(values).length > 0) {
        db.update(cars).set(values).where(eq(cars.id, id)).run();
      }
    });
    bus.emit({ type: "car.updated", payload: { carId: id } });
    return requireCar(id);
  }

  /** Removes every car, and through cascades every slot and booking. Used by test seeding. */
  function deleteAllCars(): void {
    db.delete(cars).run();
    db.delete(brands).run();
  }

  function generateSlots(input: GenerateSlotsInput): Slot[] {
    const car = requireCar(input.carId);
    const duration = input.durationMinutes ?? SLOT_DURATION_MINUTES;
    if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
      throw new ValidationError("durationMinutes must be a whole number between 5 and 240.");
    }
    if (!Number.isInteger(input.startHour) || input.startHour < 0 || input.startHour > 23) {
      throw new ValidationError("startHour must be between 0 and 23.");
    }
    if (!Number.isInteger(input.endHour) || input.endHour <= input.startHour || input.endHour > 24) {
      throw new ValidationError("endHour must be after startHour and at most 24.");
    }
    const from = parseLocalDay(input.from);
    const to = parseLocalDay(input.to);
    if (from > to) throw new ValidationError("from must not be after to.");
    if (daysBetween(input.from, input.to) > MAX_SLOT_RANGE_DAYS) {
      throw new ValidationError(`The range may cover at most ${MAX_SLOT_RANGE_DAYS} days.`);
    }
    const created: Slot[] = [];
    transaction(() => {
      for (let day = new Date(from); day <= to; day.setDate(day.getDate() + 1)) {
        for (const minutes of slotStartsForDay(input.startHour, input.endHour, duration)) {
          const startsAt = new Date(day);
          startsAt.setHours(0, minutes, 0, 0);
          const slot: Slot = {
            id: nanoid(10),
            carId: car.id,
            startsAt: startsAt.getTime(),
            endsAt: startsAt.getTime() + duration * 60 * 1000,
            createdAt: Date.now(),
          };
          const result = db.insert(slots).values(slot).onConflictDoNothing().run();
          if (result.changes > 0) created.push(slot);
        }
      }
    });
    bus.emit({ type: "slots.generated", payload: { carId: car.id, count: created.length } });
    return created;
  }

  function listSlots(query: { carId: string; date: string }): SlotWithBooking[] {
    const { start, end } = dayRange(query.date);
    const rows = db
      .select({
        slot: slots,
        bookingId: bookings.id,
        customerName: bookings.customerName,
      })
      .from(slots)
      .leftJoin(bookings, and(eq(bookings.slotId, slots.id), eq(bookings.status, "confirmed")))
      .where(and(eq(slots.carId, query.carId), gte(slots.startsAt, start), lt(slots.startsAt, end)))
      .orderBy(asc(slots.startsAt))
      .all();
    const current = now();
    return rows.map((row) => ({
      ...row.slot,
      booking: row.bookingId ? { id: row.bookingId, customerName: row.customerName ?? "" } : null,
      past: row.slot.startsAt < current,
    }));
  }

  function listAvailableSlots(query: { carId: string; date: string }): Slot[] {
    return listSlots(query)
      .filter((slot) => slot.booking === null && !slot.past)
      .map(({ booking, past, ...slot }) => (void booking, void past, slot));
  }

  function listSlotDays(carId: string): { date: string; total: number; available: number }[] {
    // Sorted by date; used by the calendar to mark selectable, full, and empty days.
    const rows = db
      .select({ startsAt: slots.startsAt, bookingId: bookings.id })
      .from(slots)
      .leftJoin(bookings, and(eq(bookings.slotId, slots.id), eq(bookings.status, "confirmed")))
      .where(eq(slots.carId, carId))
      .orderBy(asc(slots.startsAt))
      .all();
    const current = now();
    const days = new Map<string, { date: string; total: number; available: number }>();
    for (const row of rows) {
      const date = toLocalDay(new Date(row.startsAt));
      const entry = days.get(date) ?? { date, total: 0, available: 0 };
      entry.total += 1;
      if (!row.bookingId && row.startsAt >= current) entry.available += 1;
      days.set(date, entry);
    }
    return [...days.values()];
  }

  function deleteSlot(slotId: string): void {
    transaction(() => {
      const slot = db.select().from(slots).where(eq(slots.id, slotId)).get();
      if (!slot) throw new NotFoundError(`Slot ${slotId}`);
      const confirmed = db
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(eq(bookings.slotId, slotId), eq(bookings.status, "confirmed")))
        .get();
      if (confirmed) throw new BookingStateError("This slot has a confirmed booking. Cancel it first.");
      db.delete(slots).where(eq(slots.id, slotId)).run();
      bus.emit({ type: "slot.deleted", payload: { carId: slot.carId, slotId } });
    });
  }

  function createBooking(input: NewBooking): Booking {
    const customerName = input.customerName?.trim() ?? "";
    if (!customerName) throw new ValidationError("A customer name is required.");
    const booking = transaction(() => {
      const found = db
        .select({ slot: slots, active: cars.active })
        .from(slots)
        .innerJoin(cars, eq(cars.id, slots.carId))
        .where(eq(slots.id, input.slotId))
        .get();
      if (!found) throw new NotFoundError(`Slot ${input.slotId}`);
      const slot = found.slot;
      if (!found.active) throw new BookingStateError("This car is not available for test drives right now.");
      if (slot.startsAt < now()) throw new BookingStateError("That slot has already started. Pick a later one.");
      const taken = db
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(eq(bookings.slotId, slot.id), eq(bookings.status, "confirmed")))
        .get();
      if (taken) throw new SlotTakenError();
      const record: Booking = {
        id: nanoid(10),
        slotId: slot.id,
        customerName,
        customerEmail: input.customerEmail?.trim() || null,
        note: input.note?.trim() || null,
        status: "confirmed",
        createdAt: Date.now(),
      };
      db.insert(bookings).values(record).run();
      return { record, carId: slot.carId };
    });
    bus.emit({
      type: "booking.created",
      payload: { bookingId: booking.record.id, slotId: booking.record.slotId, carId: booking.carId },
    });
    return booking.record;
  }

  function cancelBooking(bookingId: string): Booking {
    const result = transaction(() => {
      const row = db
        .select({ booking: bookings, carId: slots.carId })
        .from(bookings)
        .innerJoin(slots, eq(slots.id, bookings.slotId))
        .where(eq(bookings.id, bookingId))
        .get();
      if (!row) throw new NotFoundError(`Booking ${bookingId}`);
      if (row.booking.status === "cancelled") {
        throw new BookingStateError("This booking is already cancelled.");
      }
      db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, bookingId)).run();
      return { booking: { ...row.booking, status: "cancelled" as const }, carId: row.carId };
    });
    bus.emit({
      type: "booking.cancelled",
      payload: { bookingId, slotId: result.booking.slotId, carId: result.carId },
    });
    return result.booking;
  }

  function bookingQuery() {
    return db
      .select({ booking: bookings, slot: slots, car: carColumns })
      .from(bookings)
      .innerJoin(slots, eq(slots.id, bookings.slotId))
      .innerJoin(cars, eq(cars.id, slots.carId))
      .innerJoin(models, eq(models.id, cars.modelId))
      .innerJoin(brands, eq(brands.id, models.brandId));
  }

  function getBooking(bookingId: string): BookingDetail | null {
    const row = bookingQuery().where(eq(bookings.id, bookingId)).get();
    return row ? { ...row.booking, slot: row.slot, car: toCar(row.car) } : null;
  }

  function listBookings(query: { status?: BookingStatus; carId?: string } = {}): BookingDetail[] {
    const conditions = [];
    if (query.status) conditions.push(eq(bookings.status, query.status));
    if (query.carId) conditions.push(eq(slots.carId, query.carId));
    return bookingQuery()
      .where(and(...conditions))
      .orderBy(desc(bookings.createdAt), desc(sql`${bookings}.rowid`))
      .all()
      .map((row) => ({ ...row.booking, slot: row.slot, car: toCar(row.car) }));
  }

  return {
    findCars,
    filterOptions,
    findCar,
    createCar,
    updateCar,
    deleteAllCars,
    listBrands,
    createBrand,
    createModel,
    addModel,
    generateSlots,
    listSlots,
    listAvailableSlots,
    listSlotDays,
    deleteSlot,
    createBooking,
    cancelBooking,
    getBooking,
    listBookings,
  };
}

export type BookingService = ReturnType<typeof createBookingService>;

function validateCarFields(car: {
  brand: string;
  model: string;
  year: number;
  seats: number;
  color: string;
  bodyType: string;
  powertrain: string;
  transmission: string;
  drivetrain: string;
}) {
  const enums: [string, string, readonly string[]][] = [
    ["bodyType", car.bodyType, BODY_TYPES],
    ["powertrain", car.powertrain, POWERTRAINS],
    ["transmission", car.transmission, TRANSMISSIONS],
    ["drivetrain", car.drivetrain, DRIVETRAINS],
  ];
  for (const [name, value, allowed] of enums) {
    if (!allowed.includes(value)) throw new ValidationError(`${name} must be one of ${allowed.join(", ")}.`);
  }
  if (!car.brand.trim()) throw new ValidationError("Brand is required.");
  if (!car.model.trim()) throw new ValidationError("Model is required.");
  if (!Number.isInteger(car.year) || car.year < 1990 || car.year > 2100) {
    throw new ValidationError("Year must be between 1990 and 2100.");
  }
  if (!Number.isInteger(car.seats) || car.seats < 1 || car.seats > 12) {
    throw new ValidationError("Seats must be between 1 and 12.");
  }
  if (!COLOR_NAMES.includes(car.color as CarColor)) {
    throw new ValidationError(`Color must be one of ${COLOR_NAMES.join(", ")}.`);
  }
}

export function toLocalDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
