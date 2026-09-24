import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";
import { BookingServiceError, type BookingService } from "@/lib/booking-service";
import { BODY_TYPES, BOOKING_STATUSES, COLOR_NAMES, DRIVETRAINS, POWERTRAINS, TRANSMISSIONS } from "@/lib/car-enums";
import { CarFilterError, carFilterShape, parseCarFilters } from "@/lib/car-filters";
import { ISO_DAY_PATTERN } from "@/lib/dates";
import { TOOL_DEFS, type ToolDef } from "@/lib/tool-defs";
import { formatBooking, formatBookings, formatBrands, formatCars, formatSlots } from "@/lib/tool-output";

export const MCP_TOOL_NAMES = [
  "find_cars",
  "list_available_slots",
  "get_booking",
  "book_test_drive",
  "cancel_booking",
  "list_bookings",
  "create_car",
  "generate_slots",
  "list_brands",
  "add_model",
] as const;

type ToolResult = {
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

function ok(text: string, structuredContent?: Record<string, unknown>): ToolResult {
  return { content: [{ type: "text", text }], structuredContent };
}

function fail(error: unknown): ToolResult {
  const message =
    error instanceof BookingServiceError || error instanceof CarFilterError
      ? error.message
      : "Something went wrong. Try again.";
  if (!(error instanceof BookingServiceError) && !(error instanceof CarFilterError)) console.error(error);
  return { content: [{ type: "text", text: message }], isError: true };
}

function withDescriptions<S extends z.ZodRawShape>(shape: S, def: ToolDef): S {
  const out: Record<string, z.ZodTypeAny> = {};
  for (const [key, schema] of Object.entries(shape)) {
    const description = def.params[key];
    const typed = schema as z.ZodTypeAny;
    out[key] = description ? typed.describe(description) : typed;
  }
  return out as unknown as S;
}

function annotations(def: ToolDef) {
  return {
    title: def.name.replaceAll("_", " "),
    readOnlyHint: def.annotations.readOnlyHint,
    destructiveHint: def.name === "cancel_booking",
    idempotentHint: def.annotations.readOnlyHint,
    openWorldHint: false,
  };
}

const ISO_DAY = z.string().regex(ISO_DAY_PATTERN, "Use the format YYYY-MM-DD.");

export function createTestDriveServer(service: BookingService): McpServer {
  const server = new McpServer(
    { name: "testdrive", version: "1.0.0" },
    {
      instructions:
        "Book test drives at a car dealership. Start with find_cars to see the fleet, list_available_slots for a car and day, then book_test_drive with a slot id and the customer's name. Dates are YYYY-MM-DD in the dealership's local time.",
    },
  );

  const defs = TOOL_DEFS;

  server.registerTool(
    defs.find_cars.name,
    {
      description: defs.find_cars.description,
      inputSchema: z.object(withDescriptions(carFilterShape, defs.find_cars)),
      annotations: annotations(defs.find_cars),
    },
    async (args) => {
      try {
        const cars = service.findCars(parseCarFilters(args));
        return ok(formatCars(cars), { cars });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    defs.list_available_slots.name,
    {
      description: defs.list_available_slots.description,
      inputSchema: z.object(withDescriptions({ car: z.string(), date: ISO_DAY }, defs.list_available_slots)),
      annotations: annotations(defs.list_available_slots),
    },
    async ({ car: carQuery, date }) => {
      try {
        const car = service.findCar(carQuery);
        if (!car) throw new BookingServiceError(`No car matches "${carQuery}". Use find_cars to see the fleet.`, "not_found");
        const slots = service.listAvailableSlots({ carId: car.id, date });
        return ok(formatSlots(car, date, slots), { carId: car.id, date, slots });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    defs.get_booking.name,
    {
      description: defs.get_booking.description,
      inputSchema: z.object(withDescriptions({ bookingId: z.string() }, defs.get_booking)),
      annotations: annotations(defs.get_booking),
    },
    async ({ bookingId }) => {
      try {
        const booking = service.getBooking(bookingId);
        if (!booking) throw new BookingServiceError(`Booking ${bookingId} was not found.`, "not_found");
        return ok(formatBooking(booking), { booking });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    defs.book_test_drive.name,
    {
      description: defs.book_test_drive.description,
      inputSchema: z.object(
        withDescriptions(
          {
            slotId: z.string(),
            customerName: z.string().min(1),
            customerEmail: z.string().optional(),
            note: z.string().optional(),
          },
          defs.book_test_drive,
        ),
      ),
      annotations: annotations(defs.book_test_drive),
    },
    async (input) => {
      try {
        const booking = service.createBooking(input);
        const detail = service.getBooking(booking.id)!;
        return ok(formatBooking(detail), { bookingId: booking.id, booking: detail });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    defs.cancel_booking.name,
    {
      description: defs.cancel_booking.description,
      inputSchema: z.object(withDescriptions({ bookingId: z.string() }, defs.cancel_booking)),
      annotations: annotations(defs.cancel_booking),
    },
    async ({ bookingId }) => {
      try {
        service.cancelBooking(bookingId);
        const detail = service.getBooking(bookingId)!;
        return ok(formatBooking(detail), { bookingId, booking: detail });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    defs.list_bookings.name,
    {
      description: defs.list_bookings.description,
      inputSchema: z.object(withDescriptions({ status: z.enum(BOOKING_STATUSES).optional() }, defs.list_bookings)),
      annotations: annotations(defs.list_bookings),
    },
    async ({ status }) => {
      try {
        const bookings = service.listBookings({ status });
        return ok(formatBookings(bookings), { bookings });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    defs.create_car.name,
    {
      description: defs.create_car.description,
      inputSchema: z.object(
        withDescriptions(
          {
            brand: z.string().min(1),
            model: z.string().min(1),
            year: z.number().int(),
            bodyType: z.enum(BODY_TYPES),
            powertrain: z.enum(POWERTRAINS),
            transmission: z.enum(TRANSMISSIONS),
            drivetrain: z.enum(DRIVETRAINS),
            color: z.enum(COLOR_NAMES),
            seats: z.number().int().min(1).max(12),
            towHitch: z.boolean().default(false),
            features: z.array(z.string()).default([]),
            tagline: z.string().default(""),
            imageUrls: z.array(z.string().url()).default([]),
          },
          defs.create_car,
        ),
      ),
      annotations: annotations(defs.create_car),
    },
    async ({ imageUrls, ...input }) => {
      try {
        const car = service.createCar({ ...input, images: imageUrls.map((url) => ({ url })) });
        return ok(`Added ${car.brand} ${car.model} with id ${car.id}. Use generate_slots to make it bookable.`, { carId: car.id, car });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    defs.generate_slots.name,
    {
      description: defs.generate_slots.description,
      inputSchema: z.object(
        withDescriptions(
          {
            car: z.string(),
            from: ISO_DAY,
            to: ISO_DAY,
            startHour: z.number().int().min(0).max(23),
            endHour: z.number().int().min(1).max(24),
          },
          defs.generate_slots,
        ),
      ),
      annotations: annotations(defs.generate_slots),
    },
    async ({ car: carQuery, ...range }) => {
      try {
        const car = service.findCar(carQuery);
        if (!car) throw new BookingServiceError(`No car matches "${carQuery}".`, "not_found");
        const created = service.generateSlots({ carId: car.id, ...range });
        return ok(`Added ${created.length} slots for ${car.brand} ${car.model} from ${range.from} to ${range.to}.`, {
          carId: car.id,
          count: created.length,
        });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    defs.list_brands.name,
    { description: defs.list_brands.description, inputSchema: z.object({}), annotations: annotations(defs.list_brands) },
    async () => {
      try {
        const tree = service.listBrands();
        return ok(formatBrands(tree), { brands: tree });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    defs.add_model.name,
    {
      description: defs.add_model.description,
      inputSchema: z.object(withDescriptions({ brand: z.string().min(1), model: z.string().min(1) }, defs.add_model)),
      annotations: annotations(defs.add_model),
    },
    async ({ brand: brandName, model: modelName }) => {
      try {
        const added = service.addModel(brandName, modelName);
        return ok(`Added ${added.brand} ${added.model}. Brand id ${added.brandId}, model id ${added.modelId}.`, {
          brandId: added.brandId,
          modelId: added.modelId,
        });
      } catch (error) {
        return fail(error);
      }
    },
  );

  return server;
}
