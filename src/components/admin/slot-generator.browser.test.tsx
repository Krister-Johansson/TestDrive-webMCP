import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { SlotGenerator } from "./slot-generator";

const cars = [
  { id: "c1", brand: "Norra", model: "Fjell", active: true },
  { id: "c2", brand: "Aldo", model: "Sera", active: true },
  { id: "c3", brand: "Old", model: "Timer", active: false },
];

test("previews how many slots will be created and submits", async () => {
  const onSubmit = vi.fn(async () => ({ ok: true as const, data: { count: 8 } }));
  const screen = await render(<SlotGenerator cars={cars} onSubmit={onSubmit} />);
  await screen.getByLabelText("From").fill("2026-10-01");
  await screen.getByLabelText("To").fill("2026-10-02");
  await expect.element(screen.getByText(/2 days/)).toBeVisible();
  await expect.element(screen.getByText(/20 slots/)).toBeVisible();

  await screen.getByRole("combobox", { name: "End hour" }).click();
  await page.getByRole("option", { name: "12:00" }).click();
  await expect.element(screen.getByText(/8 slots/)).toBeVisible();

  await screen.getByRole("combobox", { name: "Car" }).click();
  await page.getByRole("option", { name: "Aldo Sera" }).click();
  await screen.getByRole("button", { name: "Generate slots" }).click();
  expect(onSubmit).toHaveBeenCalledWith({ car: "c2", from: "2026-10-01", to: "2026-10-02", startHour: 9, endHour: 12 });
  await expect.element(screen.getByText(/8 slots added/)).toBeVisible();
});
