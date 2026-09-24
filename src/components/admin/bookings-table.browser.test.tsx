import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { BookingsTable } from "./bookings-table";
import { makeCar } from "../../../tests/fixtures";
import type { BookingDetail } from "@/lib/booking-service";

const car = makeCar({ id: "c1", features: [], tagline: "" });
const startsAt = new Date(2026, 9, 2, 14, 0).getTime();
const slot = { id: "s1", carId: "c1", startsAt, endsAt: startsAt + 45 * 60_000, createdAt: 0 };
const bookings: BookingDetail[] = [
  { id: "b1", slotId: "s1", customerName: "Ada", customerEmail: "ada@example.com", note: null, status: "confirmed", createdAt: 0, slot, car },
  { id: "b2", slotId: "s1", customerName: "Bob", customerEmail: null, note: "call first", status: "cancelled", createdAt: 0, slot, car },
];

test("lists bookings and cancels a confirmed one after confirmation", async () => {
  const cancel = vi.fn(async () => ({ ok: true as const, data: bookings[0] }));
  const screen = await render(<BookingsTable bookings={bookings} cancel={cancel} />);
  const rows = screen.getByRole("row");
  await expect.element(rows.nth(1)).toHaveTextContent("Ada");
  await expect.element(rows.nth(1)).toHaveTextContent("confirmed");
  await expect.element(rows.nth(2)).toHaveTextContent("cancelled");
  await expect.element(rows.nth(2).getByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

  await rows.nth(1).getByRole("button", { name: "Cancel" }).click();
  await expect.element(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel booking" }).click();
  expect(cancel).toHaveBeenCalledWith("b1");
});

test("shows an empty state", async () => {
  const screen = await render(<BookingsTable bookings={[]} cancel={async () => ({ ok: true as const, data: bookings[0] })} />);
  await expect.element(screen.getByText(/no bookings yet/i)).toBeVisible();
});
