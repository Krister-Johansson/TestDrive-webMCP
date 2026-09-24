import "../../../tests/model-context-stub.js";
import { beforeEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { makeCar } from "../../../tests/fixtures";
import type { BookingDetail } from "@/lib/booking-service";
import { WebMcpProvider } from "./provider";
import { WebMcpControls } from "./controls";
import { GlobalTools, type GlobalToolActions } from "./global-tools";
import { HomeToolset } from "./home-toolset";
import { BookToolset } from "./book-tools";
import { getBookingUiState, resetBookingUi } from "@/components/booking/booking-ui-store";

type Stub = {
  getTools(): { name: string; description: string; execute: (args: unknown) => Promise<unknown> }[];
  executeTool(name: string, args?: unknown): Promise<unknown>;
};
const stub = () => (window as unknown as { __modelContextStub: Stub }).__modelContextStub;
const toolNames = () => stub().getTools().map((tool) => tool.name).sort();

const car = makeCar({ tagline: "" });
const startsAt = new Date(2026, 9, 2, 14, 0).getTime();
const slot = { id: "slot1", carId: "car1", startsAt, endsAt: startsAt + 45 * 60_000, createdAt: 0 };
const booking: BookingDetail = {
  id: "bk1", slotId: "slot1", customerName: "Ada", customerEmail: null, note: null, status: "confirmed", createdAt: 0, slot, car,
};

const actions: GlobalToolActions = {
  findCars: vi.fn(async () => ({ ok: true as const, data: [car] })),
  listAvailableSlots: vi.fn(async () => ({ ok: true as const, data: { car, slots: [slot] } })),
  getBooking: vi.fn(async () => ({ ok: true as const, data: booking })),
  createBooking: vi.fn(async () => ({ ok: true as const, data: booking })),
  cancelBooking: vi.fn(async () => ({ ok: true as const, data: { ...booking, status: "cancelled" as const } })),
};

beforeEach(() => {
  resetBookingUi();
});

test("the toggle registers the global tools and unregisters them again", async () => {
  await render(
    <WebMcpProvider>
      <WebMcpControls />
      <GlobalTools actions={actions} />
    </WebMcpProvider>,
  );
  await expect.element(page.getByText("Native")).toBeVisible();
  const toggle = page.getByRole("switch", { name: "WebMCP" });
  await expect.element(toggle).not.toBeChecked();
  expect(toolNames()).toEqual([]);

  await toggle.click();
  await expect.element(toggle).toBeChecked();
  await expect.element(page.getByText("5 tools")).toBeVisible();
  expect(toolNames()).toEqual(["book_test_drive", "cancel_booking", "find_cars", "get_booking", "list_available_slots"]);

  const result = (await stub().executeTool("book_test_drive", { slotId: "slot1", customerName: "Ada" })) as { content: { text: string }[] };
  const text = result.content.map((c) => c.text).join("");
  expect(actions.createBooking).toHaveBeenCalledWith({ slotId: "slot1", customerName: "Ada", customerEmail: undefined, note: undefined });
  expect(text).toContain("bk1");
  expect(text.length).toBeLessThanOrEqual(1500);

  await toggle.click();
  await expect.element(toggle).not.toBeChecked();
  expect(toolNames()).toEqual([]);
});

test("page tools register only while their page is mounted", async () => {
  const applyFilters = vi.fn(async () => 2);
  const openCar = vi.fn(async () => "Opened Norra Fjell");
  const screen = await render(
    <WebMcpProvider defaultEnabled>
      <HomeToolset applyFilters={applyFilters} openCar={openCar} />
    </WebMcpProvider>,
  );
  await vi.waitFor(() => expect(toolNames()).toEqual(["filter_cars", "select_car"]));
  const filtered = (await stub().executeTool("filter_cars", { powertrain: "electric" })) as { content: { text: string }[] };
  expect(applyFilters).toHaveBeenCalledWith({ powertrain: "electric" });
  expect(filtered.content[0].text).toContain("2");

  screen.unmount();
  await vi.waitFor(() => expect(toolNames()).toEqual([]));

  await render(
    <WebMcpProvider defaultEnabled>
      <BookToolset car={car} slots={[{ ...slot, booking: null, past: false }]} />
    </WebMcpProvider>,
  );
  await vi.waitFor(() => expect(toolNames()).toEqual(["select_slot"]));
  const selected = (await stub().executeTool("select_slot", { slotId: "slot1" })) as { content: { text: string }[] };
  expect(selected.content[0].text).toContain("14:00");
  expect(getBookingUiState()).toEqual({ selectedSlotId: "slot1", sheetOpen: true });
  const missing = (await stub().executeTool("select_slot", { slotId: "nope" })) as { isError?: boolean };
  expect(missing.isError).toBe(true);
});

test("without document.modelContext the toggle is disabled and help explains the flag", async () => {
  const saved = document.modelContext;
  Object.defineProperty(document, "modelContext", { value: undefined, configurable: true, writable: true });
  try {
    await render(
      <WebMcpProvider>
        <WebMcpControls />
      </WebMcpProvider>,
    );
    await expect.element(page.getByText("Unavailable")).toBeVisible();
    const toggle = page.getByRole("switch", { name: "WebMCP" }).element();
    const disabled =
      toggle.hasAttribute("disabled") || toggle.getAttribute("aria-disabled") === "true" || toggle.hasAttribute("data-disabled");
    expect(disabled, toggle.outerHTML).toBe(true);
    await page.getByRole("button", { name: "How to enable WebMCP" }).click();
    const dialog = page.getByRole("dialog");
    await expect.element(dialog).toBeVisible();
    await expect.element(dialog.getByText("chrome://flags/#enable-webmcp-testing")).toBeVisible();
    await expect.element(dialog.getByText(/Chrome 149/)).toBeVisible();
  } finally {
    Object.defineProperty(document, "modelContext", { value: saved, configurable: true, writable: true });
  }
});
