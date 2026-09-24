import { BODY_TYPES, BOOKING_STATUSES, COLOR_NAMES, DRIVETRAINS, POWERTRAINS, TRANSMISSIONS } from "./car-enums";
import { ISO_DAY_PATTERN_SOURCE } from "./dates";
import { TOOL_DEFS } from "./tool-defs";

/** JSON Schema literals for the WebMCP tools. Descriptions come from the shared tool definitions. */
type Property = {
  type: "string" | "integer" | "number" | "boolean" | "array";
  description: string;
  enum?: readonly string[];
  items?: { type: "string" };
  pattern?: string;
};

export type ObjectSchema = {
  type: "object";
  properties: Record<string, Property>;
  required: readonly string[];
};

const p = TOOL_DEFS;

function filterProperties(params: Record<string, string>): Record<string, Property> {
  return {
    brand: { type: "string", description: params.brand },
    model: { type: "string", description: params.model },
    bodyType: { type: "string", enum: BODY_TYPES, description: params.bodyType },
    powertrain: { type: "string", enum: POWERTRAINS, description: params.powertrain },
    transmission: { type: "string", enum: TRANSMISSIONS, description: params.transmission },
    drivetrain: { type: "string", enum: DRIVETRAINS, description: params.drivetrain },
    color: { type: "string", enum: COLOR_NAMES, description: params.color },
    minSeats: { type: "integer", description: params.minSeats },
    towHitch: { type: "boolean", description: params.towHitch },
    yearFrom: { type: "integer", description: params.yearFrom },
    yearTo: { type: "integer", description: params.yearTo },
    feature: { type: "string", description: params.feature },
  };
}

const DAY = ISO_DAY_PATTERN_SOURCE;

export const WEBMCP_SCHEMAS = {
  find_cars: { type: "object", properties: filterProperties(p.find_cars.params), required: [] },
  filter_cars: { type: "object", properties: filterProperties(p.filter_cars.params), required: [] },
  list_available_slots: {
    type: "object",
    properties: {
      car: { type: "string", description: p.list_available_slots.params.car },
      date: { type: "string", pattern: DAY, description: p.list_available_slots.params.date },
    },
    required: ["car", "date"],
  },
  get_booking: {
    type: "object",
    properties: { bookingId: { type: "string", description: p.get_booking.params.bookingId } },
    required: ["bookingId"],
  },
  book_test_drive: {
    type: "object",
    properties: {
      slotId: { type: "string", description: p.book_test_drive.params.slotId },
      customerName: { type: "string", description: p.book_test_drive.params.customerName },
      customerEmail: { type: "string", description: p.book_test_drive.params.customerEmail },
      note: { type: "string", description: p.book_test_drive.params.note },
    },
    required: ["slotId", "customerName"],
  },
  cancel_booking: {
    type: "object",
    properties: { bookingId: { type: "string", description: p.cancel_booking.params.bookingId } },
    required: ["bookingId"],
  },
  list_bookings: {
    type: "object",
    properties: { status: { type: "string", enum: BOOKING_STATUSES, description: p.list_bookings.params.status } },
    required: [],
  },
  create_car: {
    type: "object",
    properties: {
      brand: { type: "string", description: p.create_car.params.brand },
      model: { type: "string", description: p.create_car.params.model },
      year: { type: "integer", description: p.create_car.params.year },
      bodyType: { type: "string", enum: BODY_TYPES, description: p.create_car.params.bodyType },
      powertrain: { type: "string", enum: POWERTRAINS, description: p.create_car.params.powertrain },
      transmission: { type: "string", enum: TRANSMISSIONS, description: p.create_car.params.transmission },
      drivetrain: { type: "string", enum: DRIVETRAINS, description: p.create_car.params.drivetrain },
      color: { type: "string", enum: COLOR_NAMES, description: p.create_car.params.color },
      seats: { type: "integer", description: p.create_car.params.seats },
      towHitch: { type: "boolean", description: p.create_car.params.towHitch },
      features: { type: "array", items: { type: "string" }, description: p.create_car.params.features },
      tagline: { type: "string", description: p.create_car.params.tagline },
      imageUrls: { type: "array", items: { type: "string" }, description: p.create_car.params.imageUrls },
    },
    required: ["brand", "model", "year", "bodyType", "powertrain", "transmission", "drivetrain", "color", "seats"],
  },
  generate_slots: {
    type: "object",
    properties: {
      car: { type: "string", description: p.generate_slots.params.car },
      from: { type: "string", pattern: DAY, description: p.generate_slots.params.from },
      to: { type: "string", pattern: DAY, description: p.generate_slots.params.to },
      startHour: { type: "integer", description: p.generate_slots.params.startHour },
      endHour: { type: "integer", description: p.generate_slots.params.endHour },
    },
    required: ["car", "from", "to", "startHour", "endHour"],
  },
  list_brands: { type: "object", properties: {}, required: [] },
  add_model: {
    type: "object",
    properties: {
      brand: { type: "string", description: p.add_model.params.brand },
      model: { type: "string", description: p.add_model.params.model },
    },
    required: ["brand", "model"],
  },
  select_car: {
    type: "object",
    properties: { car: { type: "string", description: p.select_car.params.car } },
    required: ["car"],
  },
  select_slot: {
    type: "object",
    properties: { slotId: { type: "string", description: p.select_slot.params.slotId } },
    required: ["slotId"],
  },
} as const satisfies Record<string, ObjectSchema>;
