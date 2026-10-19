import "../../../tests/model-context-stub.js";
import { beforeEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { makeCar } from "../../../tests/fixtures";
import { WebMcpProvider } from "./provider";
import { ActivityFeed } from "./activity-feed";
import { clearActivity } from "./activity-store";
import { BookToolset } from "./book-tools";
import { GlobalTools, type GlobalToolActions } from "./global-tools";

type Stub = { executeTool(name: string, args?: unknown): Promise<unknown> };
const stub = () => (window as unknown as { __modelContextStub: Stub }).__modelContextStub;

const car = makeCar({ tagline: "" });
const startsAt = new Date(2026, 9, 2, 14, 0).getTime();
const slot = { id: "slot1", carId: "car1", startsAt, endsAt: startsAt + 45 * 60_000, createdAt: 0 };

const actions: GlobalToolActions = {
  findCars: vi.fn(async () => ({ ok: true as const, data: [car] })),
  listAvailableSlots: vi.fn(async () => ({ ok: true as const, data: { car, slots: [slot] } })),
  getBooking: vi.fn(async () => ({ ok: false as const, error: "No booking with that id.", code: "not_found" })),
  createBooking: vi.fn(async () => ({ ok: false as const, error: "unused", code: "unused" })),
  cancelBooking: vi.fn(async () => ({ ok: false as const, error: "unused", code: "unused" })),
};

beforeEach(() => {
  clearActivity();
});

test("the feed stays hidden until an agent calls a tool, then lists each call", async () => {
  await render(
    <WebMcpProvider>
      <ActivityFeed />
      <GlobalTools actions={actions} />
      <BookToolset car={car} slots={[{ ...slot, booking: null, past: false }]} />
    </WebMcpProvider>,
  );
  const feed = page.getByRole("log", { name: "Agent activity" });
  await expect.element(feed).not.toBeInTheDocument();

  await stub().executeTool("find_cars", { powertrain: "electric" });
  await expect.element(feed).toBeVisible();
  await expect.element(feed.getByText("find_cars")).toBeVisible();
  await expect.element(feed.getByText("powertrain: electric")).toBeVisible();
  await expect.element(feed.getByText("1 car:")).toBeVisible();

  await stub().executeTool("get_booking", { bookingId: "nope" });
  await expect.element(feed.getByText("No booking with that id.")).toBeVisible();
  await expect.element(feed.getByLabelText("Failed")).toBeVisible();

  await page.getByRole("button", { name: "Clear agent activity" }).click();
  await expect.element(feed).not.toBeInTheDocument();
});
