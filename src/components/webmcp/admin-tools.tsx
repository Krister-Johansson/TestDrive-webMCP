"use client";

import type { Car } from "@/db/schema";
import { addModelAction, createCarAction, generateSlotsAction, listBookingsAction, listBrandsAction, type ActionResult } from "@/lib/actions";
import type { BookingDetail, BrandTree, NewCar } from "@/lib/booking-service";
import { BODY_TYPES, COLOR_NAMES, DRIVETRAINS, POWERTRAINS, TRANSMISSIONS } from "@/lib/car-enums";
import { TOOL_DEFS } from "@/lib/tool-defs";
import { formatBookings, formatBrands } from "@/lib/tool-output";
import { WEBMCP_SCHEMAS } from "@/lib/webmcp-schemas";
import { toolError, useAppTool } from "./use-app-tool";

export type AdminToolActions = {
  listBookings: (input: { status?: "confirmed" | "cancelled" }) => Promise<ActionResult<BookingDetail[]>>;
  createCar: (input: NewCar) => Promise<ActionResult<Car>>;
  generateSlots: (input: { car: string; from: string; to: string; startHour: number; endHour: number }) => Promise<ActionResult<{ car: Car; count: number }>>;
  listBrands: () => Promise<ActionResult<BrandTree[]>>;
  addModel: (brand: string, model: string) => Promise<ActionResult<{ brandId: string; modelId: string }>>;
};

const defaultActions: AdminToolActions = {
  listBookings: listBookingsAction,
  createCar: createCarAction,
  generateSlots: generateSlotsAction,
  listBrands: listBrandsAction,
  addModel: addModelAction,
};

function oneOf<T extends string>(value: unknown, options: readonly T[]): T | null {
  return options.includes(value as T) ? (value as T) : null;
}

export function AdminToolset({ actions = defaultActions }: { actions?: AdminToolActions }) {
  useAppTool(TOOL_DEFS.list_bookings, WEBMCP_SCHEMAS.list_bookings, async (input) => {
    const status = oneOf(input.status, ["confirmed", "cancelled"] as const) ?? undefined;
    const result = await actions.listBookings({ status });
    return result.ok ? formatBookings(result.data) : toolError(result.error);
  });

  useAppTool(TOOL_DEFS.create_car, WEBMCP_SCHEMAS.create_car, async (input) => {
    const bodyType = oneOf(input.bodyType, BODY_TYPES);
    const powertrain = oneOf(input.powertrain, POWERTRAINS);
    const transmission = oneOf(input.transmission, TRANSMISSIONS);
    const drivetrain = oneOf(input.drivetrain, DRIVETRAINS);
    const color = oneOf(input.color, COLOR_NAMES);
    if (!bodyType || !powertrain || !transmission || !drivetrain || !color) {
      return toolError("bodyType, powertrain, transmission, drivetrain, and color must use the listed values.");
    }
    const result = await actions.createCar({
      brand: String(input.brand ?? ""),
      model: String(input.model ?? ""),
      year: Number(input.year),
      bodyType,
      powertrain,
      transmission,
      drivetrain,
      color,
      seats: Number(input.seats),
      towHitch: input.towHitch === true,
      features: Array.isArray(input.features) ? input.features.map(String) : [],
      tagline: typeof input.tagline === "string" ? input.tagline : "",
      images: Array.isArray(input.imageUrls) ? input.imageUrls.map((url) => ({ url: String(url) })) : [],
    });
    return result.ok
      ? `Added ${result.data.brand} ${result.data.model} with id ${result.data.id}. Use generate_slots to make it bookable.`
      : toolError(result.error);
  });

  useAppTool(TOOL_DEFS.generate_slots, WEBMCP_SCHEMAS.generate_slots, async (input) => {
    const result = await actions.generateSlots({
      car: String(input.car ?? ""),
      from: String(input.from ?? ""),
      to: String(input.to ?? ""),
      startHour: Number(input.startHour),
      endHour: Number(input.endHour),
    });
    return result.ok
      ? `Added ${result.data.count} slots for ${result.data.car.brand} ${result.data.car.model}.`
      : toolError(result.error);
  });

  useAppTool(TOOL_DEFS.list_brands, WEBMCP_SCHEMAS.list_brands, async () => {
    const result = await actions.listBrands();
    return result.ok ? formatBrands(result.data) : toolError(result.error);
  });

  useAppTool(TOOL_DEFS.add_model, WEBMCP_SCHEMAS.add_model, async (input) => {
    const result = await actions.addModel(String(input.brand ?? ""), String(input.model ?? ""));
    return result.ok ? `Added model. Brand id ${result.data.brandId}, model id ${result.data.modelId}.` : toolError(result.error);
  });

  return null;
}
