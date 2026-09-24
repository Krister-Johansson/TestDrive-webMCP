import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/db";
import { SEED_CARS, seedDatabase } from "@/db/seed";
import { createBookingService, type BookingService } from "@/lib/booking-service";
import { createEventBus } from "@/lib/events";
import { TOOL_DEFS } from "@/lib/tool-defs";
import { createTestDriveServer, MCP_TOOL_NAMES } from "./server";

type ToolResult = { content: { type: string; text?: string }[]; isError?: boolean; structuredContent?: unknown };

describe("test drive MCP server", () => {
  let service: BookingService;
  let client: Client;

  beforeEach(async () => {
    service = createBookingService(createTestDb(), createEventBus());
    seedDatabase(service, { days: 2, startHour: 9, endHour: 12, today: new Date(2026, 9, 1) });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createTestDriveServer(service);
    client = new Client({ name: "test", version: "1.0.0" });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  async function call(name: string, args: Record<string, unknown> = {}) {
    return (await client.callTool({ name, arguments: args })) as ToolResult;
  }
  const text = (r: ToolResult) => r.content.map((c) => c.text ?? "").join("\n");

  it("lists the shared tool set with the shared descriptions", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...MCP_TOOL_NAMES].sort());
    for (const tool of tools) {
      expect(tool.description).toBe(TOOL_DEFS[tool.name as keyof typeof TOOL_DEFS].description);
    }
    const findCars = tools.find((t) => t.name === "find_cars")!;
    expect(findCars.annotations?.readOnlyHint).toBe(true);
    expect(JSON.stringify(findCars.inputSchema)).toContain("powertrain");
  });

  it("finds cars with and without filters", async () => {
    const all = await call("find_cars");
    expect(all.isError).toBeFalsy();
    expect(text(all)).toContain(`${SEED_CARS.length} cars`);
    expect(text(all)).toContain("Norra Fjell");

    const filtered = await call("find_cars", { powertrain: "electric", towHitch: true });
    expect(text(filtered)).toContain("2 cars");
    expect(text(filtered)).toContain("Kestrel Heath");
    expect(text(filtered)).not.toContain("Kestrel Lane");
    expect((filtered.structuredContent as { cars: unknown[] }).cars).toHaveLength(2);
  });

  it("rejects an invalid enum with a readable error", async () => {
    const result = await call("find_cars", { bodyType: "truck" });
    expect(result.isError).toBe(true);
    expect(text(result)).toMatch(/bodyType/);
  });

  it("lists free slots by car name or id and books one", async () => {
    const byName = await call("list_available_slots", { car: "Norra Fjell", date: "2026-10-01" });
    expect(text(byName)).toContain("4 free slots");
    const slotId = /slot (\S+):/.exec(text(byName))![1];
    const car = service.findCar("Norra Fjell")!;
    const byId = await call("list_available_slots", { car: car.id, date: "2026-10-01" });
    expect(text(byId)).toBe(text(byName));

    const booked = await call("book_test_drive", { slotId, customerName: "Ada Lovelace", customerEmail: "ada@example.com" });
    expect(booked.isError).toBeFalsy();
    expect(text(booked)).toMatch(/Booking \S+ is confirmed/);
    expect(text(booked)).toContain("Ada Lovelace");
    const bookingId = (booked.structuredContent as { bookingId: string }).bookingId;

    const again = await call("book_test_drive", { slotId, customerName: "Bob" });
    expect(again.isError).toBe(true);
    expect(text(again)).toContain("just booked");

    const fetched = await call("get_booking", { bookingId });
    expect(text(fetched)).toContain("confirmed");

    const cancelled = await call("cancel_booking", { bookingId });
    expect(text(cancelled)).toContain("cancelled");
    expect(text(await call("list_available_slots", { car: "Norra Fjell", date: "2026-10-01" }))).toContain("4 free slots");

    const list = await call("list_bookings", { status: "cancelled" });
    expect(text(list)).toContain(bookingId);
  });

  it("lists brands as a tree and adds models", async () => {
    const tree = await call("list_brands");
    expect(text(tree)).toContain("Norra: Fjell, Skog, Vik");
    const added = await call("add_model", { brand: "Volvo", model: "V70" });
    expect(added.isError).toBeFalsy();
    expect(text(await call("list_brands"))).toContain("Volvo: V70");
    const dup = await call("add_model", { brand: "volvo", model: "v70" });
    expect(dup.isError).toBe(true);
  });

  it("reports unknown cars, slots, and bookings as errors", async () => {
    expect((await call("list_available_slots", { car: "Batmobile", date: "2026-10-01" })).isError).toBe(true);
    expect((await call("book_test_drive", { slotId: "nope", customerName: "Ada" })).isError).toBe(true);
    expect((await call("get_booking", { bookingId: "nope" })).isError).toBe(true);
  });

  it("creates a car and generates slots for it", async () => {
    const created = await call("create_car", {
      brand: "Norra",
      model: "Ekko",
      year: 2026,
      bodyType: "hatchback",
      powertrain: "electric",
      transmission: "automatic",
      drivetrain: "fwd",
      color: "Orange",
      seats: 5,
      towHitch: false,
      features: ["heated seats"],
    });
    expect(created.isError).toBeFalsy();
    const carId = (created.structuredContent as { carId: string }).carId;
    const slots = await call("generate_slots", { car: carId, from: "2026-10-05", to: "2026-10-05", startHour: 10, endHour: 12 });
    expect(text(slots)).toContain("2 slots");
    expect(service.listSlots({ carId, date: "2026-10-05" })).toHaveLength(2);
  });
});
