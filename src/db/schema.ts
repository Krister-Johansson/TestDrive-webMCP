import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  BODY_TYPES,
  BOOKING_STATUSES,
  COLOR_NAMES,
  DRIVETRAINS,
  POWERTRAINS,
  TRANSMISSIONS,
} from "@/lib/car-enums";

export const brands = sqliteTable(
  "brands",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("brands_name_unique").on(table.name)],
);

export const models = sqliteTable(
  "models",
  {
    id: text().primaryKey(),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    name: text().notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("models_brand_name_unique").on(table.brandId, table.name)],
);

export const cars = sqliteTable("cars", {
  id: text().primaryKey(),
  modelId: text("model_id")
    .notNull()
    .references(() => models.id, { onDelete: "cascade" }),
  year: integer().notNull(),
  bodyType: text("body_type", { enum: BODY_TYPES }).notNull(),
  powertrain: text({ enum: POWERTRAINS }).notNull(),
  transmission: text({ enum: TRANSMISSIONS }).notNull(),
  drivetrain: text({ enum: DRIVETRAINS }).notNull(),
  color: text({ enum: COLOR_NAMES }).notNull(),
  seats: integer().notNull(),
  towHitch: integer("tow_hitch", { mode: "boolean" }).notNull().default(false),
  features: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  tagline: text().notNull().default(""),
  active: integer({ mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});

export const carImages = sqliteTable(
  "car_images",
  {
    id: text().primaryKey(),
    carId: text("car_id")
      .notNull()
      .references(() => cars.id, { onDelete: "cascade" }),
    url: text().notNull(),
    credit: text().notNull().default(""),
    sourceUrl: text("source_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("car_images_car_idx").on(table.carId, table.sortOrder)],
);

export const slots = sqliteTable(
  "slots",
  {
    id: text().primaryKey(),
    carId: text("car_id")
      .notNull()
      .references(() => cars.id, { onDelete: "cascade" }),
    startsAt: integer("starts_at").notNull(),
    endsAt: integer("ends_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("slots_car_start_unique").on(table.carId, table.startsAt),
    index("slots_starts_at_idx").on(table.startsAt),
  ],
);

export const bookings = sqliteTable(
  "bookings",
  {
    id: text().primaryKey(),
    slotId: text("slot_id")
      .notNull()
      .references(() => slots.id, { onDelete: "cascade" }),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email"),
    note: text(),
    status: text({ enum: BOOKING_STATUSES }).notNull().default("confirmed"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("bookings_confirmed_slot_unique")
      .on(table.slotId)
      .where(sql`status = 'confirmed'`),
    index("bookings_created_at_idx").on(table.createdAt),
  ],
);

export type Brand = typeof brands.$inferSelect;
export type Model = typeof models.$inferSelect;
export type CarRow = typeof cars.$inferSelect;
export type CarImage = typeof carImages.$inferSelect;
/** A car joined with its brand and model names and the hex for its color. */
export type Car = CarRow & { brandId: string; brand: string; model: string; colorHex: string; images: CarImage[] };
export type Slot = typeof slots.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
