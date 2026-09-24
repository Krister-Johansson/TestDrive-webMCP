import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { BrandModelPicker } from "./brand-model-picker";
import type { BrandTree } from "@/lib/booking-service";

const brands: BrandTree[] = [
  { id: "b1", name: "Norra", models: [{ id: "m1", name: "Fjell" }, { id: "m2", name: "Vik" }] },
  { id: "b2", name: "Volvo", models: [{ id: "m3", name: "V70" }, { id: "m4", name: "XC60" }] },
];

test("shows brands as groups, searches across brand and model, and reports the pick", async () => {
  const onChange = vi.fn();
  const screen = await render(<BrandModelPicker brands={brands} value={null} onChange={onChange} />);
  const input = screen.getByRole("combobox", { name: "Brand and model" });
  await input.click();
  await expect.element(page.getByRole("option", { name: "Fjell" })).toBeVisible();
  await expect.element(page.getByText("Volvo", { exact: true })).toBeVisible();

  await input.fill("v7");
  await expect.element(page.getByRole("option", { name: "V70" })).toBeVisible();
  await expect.element(page.getByRole("option", { name: "Fjell" })).not.toBeInTheDocument();
  await page.getByRole("option", { name: "V70" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ brand: "Volvo", model: "V70" });
});

test("searching by brand name lists that brand's models", async () => {
  const screen = await render(<BrandModelPicker brands={brands} value={{ brand: "Norra", model: "Vik" }} onChange={() => {}} />);
  const input = screen.getByRole("combobox", { name: "Brand and model" });
  await expect.element(input).toHaveValue("Norra Vik");
  await input.fill("volv");
  await expect.element(page.getByRole("option", { name: "XC60" })).toBeVisible();
  await expect.element(page.getByRole("option", { name: "Vik" })).not.toBeInTheDocument();
});
