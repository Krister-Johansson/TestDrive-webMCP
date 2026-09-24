import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { ConfirmSheet } from "./confirm-sheet";
import { makeCar } from "../../../tests/fixtures";
import type { ActionResult } from "@/lib/actions";
import type { BookingDetail } from "@/lib/booking-service";

const car = makeCar({ tagline: "" });
const startsAt = new Date(2026, 9, 2, 14, 0).getTime();
const slot = { id: "slot1", carId: "car1", startsAt, endsAt: startsAt + 45 * 60_000, createdAt: 0 };

test("requires a name, then submits and shows the confirmation", async () => {
  const submit = vi.fn(
    async (input: { slotId: string; customerName: string }): Promise<ActionResult<BookingDetail>> => ({
      ok: true,
      data: {
        id: "bk1",
        slotId: input.slotId,
        customerName: input.customerName,
        customerEmail: null,
        note: null,
        status: "confirmed",
        createdAt: 0,
        slot,
        car,
      },
    }),
  );
  await render(<ConfirmSheet car={car} slot={slot} open onOpenChange={() => {}} submit={submit} />);
  await expect.element(page.getByRole("dialog")).toBeVisible();
  await expect.element(page.getByText("14:00")).toBeVisible();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect.element(page.getByText(/name is required/i)).toBeVisible();
  expect(submit).not.toHaveBeenCalled();

  await page.getByRole("textbox", { name: "Name" }).fill("Ada Lovelace");
  await page.getByRole("button", { name: "Confirm booking" }).click();
  expect(submit).toHaveBeenCalledWith({ slotId: "slot1", customerName: "Ada Lovelace", customerEmail: "", note: "" });
  await expect.element(page.getByText(/booked/i)).toBeVisible();
  await expect.element(page.getByRole("link", { name: /view booking/i })).toHaveAttribute("href", "/bookings/bk1");
});

test("shows a server error when the slot was taken", async () => {
  const submit = vi.fn(async (): Promise<ActionResult<BookingDetail>> => ({
    ok: false,
    error: "That slot was just booked by someone else. Pick another slot.",
    code: "slot_taken",
  }));
  await render(<ConfirmSheet car={car} slot={slot} open onOpenChange={() => {}} submit={submit} />);
  await page.getByRole("textbox", { name: "Name" }).fill("Ada");
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect.element(page.getByText(/just booked by someone else/)).toBeVisible();
});
