import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SlotGrid } from "./slot-grid";
import type { SlotWithBooking } from "@/lib/booking-service";

const day = new Date(2026, 9, 2);
function slot(hour: number, minute: number, booking: SlotWithBooking["booking"] = null): SlotWithBooking {
  const startsAt = new Date(day).setHours(hour, minute, 0, 0);
  return { id: `s-${hour}-${minute}`, carId: "car1", startsAt, endsAt: startsAt + 45 * 60_000, createdAt: 0, booking, past: false };
}

test("marks booked slots as unavailable and selects free ones", async () => {
  const onSelect = vi.fn();
  const slots = [slot(9, 0), slot(9, 45, { id: "b1", customerName: "Ada" }), slot(10, 30)];
  const screen = await render(<SlotGrid slots={slots} selectedId={null} onSelect={onSelect} />);
  const booked = screen.getByRole("button", { name: /^09:45/ });
  await expect.element(booked).toBeDisabled();
  await expect.element(booked).toHaveTextContent("Booked");
  await screen.getByRole("button", { name: /^10:30/ }).click();
  expect(onSelect).toHaveBeenCalledWith(slots[2]);
});

test("marks slots that already started as past", async () => {
  const screen = await render(<SlotGrid slots={[{ ...slot(9, 0), past: true }, slot(10, 30)]} selectedId={null} onSelect={() => {}} />);
  const past = screen.getByRole("button", { name: /^09:00/ });
  await expect.element(past).toBeDisabled();
  await expect.element(past).toHaveTextContent("Past");
  await expect.element(screen.getByText("1 free")).toBeVisible();
});

test("shows the selected slot as pressed and an empty state without slots", async () => {
  const slots = [slot(9, 0)];
  const screen = await render(<SlotGrid slots={slots} selectedId="s-9-0" onSelect={() => {}} />);
  await expect.element(screen.getByRole("button", { name: /^09:00/ })).toHaveAttribute("aria-pressed", "true");
  const empty = await render(<SlotGrid slots={[]} selectedId={null} onSelect={() => {}} />);
  await expect.element(empty.getByText(/no slots/i)).toBeVisible();
  await expect.element(screen.getByRole("heading", { name: /Morning/ })).toBeVisible();
});
