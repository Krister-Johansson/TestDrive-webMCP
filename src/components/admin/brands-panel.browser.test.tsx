import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { BrandsPanel } from "./brands-panel";
import type { BrandTree } from "@/lib/booking-service";

const brands: BrandTree[] = [
  { id: "b1", name: "Norra", models: [{ id: "m1", name: "Fjell" }] },
  { id: "b2", name: "Volvo", models: [] },
];

test("lists brands with their models and adds a brand", async () => {
  const addBrand = vi.fn(async () => ({ ok: true as const, data: { id: "b3", name: "Aldo", createdAt: 0 } }));
  const addModel = vi.fn(async () => ({ ok: true as const, data: { id: "m9", brandId: "b2", name: "V70", createdAt: 0 } }));
  const screen = await render(<BrandsPanel brands={brands} addBrand={addBrand} addModel={addModel} />);
  await expect.element(screen.getByRole("heading", { name: "Norra" })).toBeVisible();
  await expect.element(screen.getByText("Fjell")).toBeVisible();
  await expect.element(screen.getByText(/no models yet/i)).toBeVisible();

  await screen.getByRole("textbox", { name: "New brand" }).fill("Aldo");
  await screen.getByRole("button", { name: "Add brand" }).click();
  expect(addBrand).toHaveBeenCalledWith("Aldo");
  await expect.element(screen.getByRole("textbox", { name: "New brand" })).toHaveValue("");
});

test("adds a model to a brand and shows a server error", async () => {
  const addBrand = vi.fn(async () => ({ ok: true as const, data: { id: "b3", name: "Aldo", createdAt: 0 } }));
  const addModel = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, data: { id: "m9", brandId: "b2", name: "V70", createdAt: 0 } })
    .mockResolvedValueOnce({ ok: false, error: 'Volvo already has a model "V70".', code: "validation" });
  const screen = await render(<BrandsPanel brands={brands} addBrand={addBrand} addModel={addModel} />);
  const input = screen.getByRole("textbox", { name: "New model for Volvo" });
  await input.fill("V70");
  await screen.getByRole("button", { name: "Add model to Volvo" }).click();
  expect(addModel).toHaveBeenCalledWith("b2", "V70");
  await input.fill("V70");
  await screen.getByRole("button", { name: "Add model to Volvo" }).click();
  await expect.element(page.getByRole("alert")).toHaveTextContent('already has a model "V70"');
});
