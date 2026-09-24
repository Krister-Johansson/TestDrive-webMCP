import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { CarFormDialog } from "./car-form-dialog";
import { makeCar } from "../../../tests/fixtures";
import type { BrandTree } from "@/lib/booking-service";

const brands: BrandTree[] = [
  { id: "b1", name: "Aldo", models: [{ id: "m1", name: "Cinque" }, { id: "m2", name: "Sera" }] },
  { id: "b2", name: "Volvo", models: [{ id: "m3", name: "V70" }] },
];

const car = makeCar({ id: "c1" }, 3);

test("edits an existing car and submits parsed values", async () => {
  const onSubmit = vi.fn(async () => ({ ok: true as const, data: car }));
  await render(<CarFormDialog car={car} brands={brands} open onOpenChange={() => {}} onSubmit={onSubmit} />);
  const dialog = page.getByRole("dialog");
  await expect.element(dialog.getByRole("heading", { name: "Edit car" })).toBeVisible();
  const picker = dialog.getByRole("combobox", { name: "Brand and model" });
  await expect.element(picker).toHaveValue("Aldo Cinque");
  await picker.fill("v7");
  await page.getByRole("option", { name: "V70" }).click();
  await dialog.getByRole("spinbutton", { name: "Year" }).fill("2027");
  await dialog.getByRole("combobox", { name: "Color" }).click();
  await page.getByRole("option", { name: "Blue" }).click();
  await dialog.getByRole("textbox", { name: "Features" }).fill("sport seats, launch control");
  await dialog.getByRole("switch", { name: "Tow hitch" }).click();
  await dialog.getByRole("button", { name: "Save car" }).click();
  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      brand: "Volvo",
      model: "V70",
      color: "Blue",
      year: 2027,
      towHitch: true,
      features: ["sport seats", "launch control"],
      bodyType: "hatchback",
    }),
  );
});

test("requires a brand and model for a new car", async () => {
  const onSubmit = vi.fn(async () => ({ ok: true as const, data: car }));
  await render(<CarFormDialog car={null} brands={brands} open onOpenChange={() => {}} onSubmit={onSubmit} />);
  const dialog = page.getByRole("dialog");
  await expect.element(dialog.getByRole("heading", { name: "Add a car" })).toBeVisible();
  await dialog.getByRole("button", { name: "Save car" }).click();
  await expect.element(dialog.getByText(/pick a brand and model/i)).toBeVisible();
  expect(onSubmit).not.toHaveBeenCalled();
});

test("shows the server error", async () => {
  const onSubmit = vi.fn(async () => ({ ok: false as const, error: "Year must be between 1990 and 2100.", code: "validation" }));
  await render(<CarFormDialog car={car} brands={brands} open onOpenChange={() => {}} onSubmit={onSubmit} />);
  await page.getByRole("dialog").getByRole("button", { name: "Save car" }).click();
  await expect.element(page.getByRole("alert")).toHaveTextContent("Year must be between 1990 and 2100.");
});
