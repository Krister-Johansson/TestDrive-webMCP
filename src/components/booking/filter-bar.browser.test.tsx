import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { FilterPanel, FilterProvider, FilterSummary, type FilterContextValue } from "./filter-bar";
import type { CarFilters } from "@/lib/car-filters";
import type { FacetOptions } from "@/lib/booking-service";

const facet = (values: string[]) => values.map((value) => ({ value, count: 1 }));
const options: FacetOptions = {
  brand: facet(["Aldo", "Kestrel", "Norra"]),
  model: [],
  bodyType: facet(["suv", "sedan", "wagon", "hatchback", "coupe"]),
  powertrain: facet(["electric", "petrol"]),
  transmission: facet(["manual", "automatic"]),
  drivetrain: facet(["fwd", "awd"]),
  color: facet(["Green", "Red"]),
  seats: [2, 5, 7],
  years: [2023, 2026],
  towHitch: true,
};

function panel(filters: CarFilters, onChange: (f: CarFilters) => void, opts: FacetOptions = options, resultCount = 8) {
  return (
    <FilterProvider value={{ state: { filters, options: opts, resultCount }, actions: { change: onChange } } satisfies FilterContextValue}>
      <FilterPanel />
    </FilterProvider>
  );
}

test("renders every filter section", async () => {
  const screen = await render(panel({}, () => {}));
  for (const name of ["Brand", "Model", "Seats", "From year", "To year"]) {
    await expect.element(screen.getByRole("combobox", { name })).toBeVisible();
  }
  for (const name of ["Body type", "Powertrain", "Transmission", "Drivetrain", "Color"]) {
    await expect.element(screen.getByRole("group", { name })).toBeVisible();
  }
  await expect.element(screen.getByRole("combobox", { name: "Model" })).toBeDisabled();
  await expect.element(screen.getByRole("switch", { name: "Tow hitch" })).toBeVisible();
  await expect.element(screen.getByRole("textbox", { name: "Feature" })).toBeVisible();
});

test("changing a control reports the merged filter object", async () => {
  const onChange = vi.fn();
  const screen = await render(panel({ bodyType: "suv" }, onChange));
  await screen.getByRole("button", { name: "Manual" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ bodyType: "suv", transmission: "manual" });

  await screen.getByRole("switch", { name: "Tow hitch" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ bodyType: "suv", towHitch: true });

  await screen.getByRole("button", { name: "Electric" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ bodyType: "suv", powertrain: "electric" });

  await screen.getByRole("button", { name: "Green" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ bodyType: "suv", color: "Green" });

  await screen.getByRole("combobox", { name: "Seats" }).click();
  await page.getByRole("option", { name: "5+ seats" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ bodyType: "suv", minSeats: 5 });
});

test("model becomes available after a brand is picked and clears when the brand changes", async () => {
  const onChange = vi.fn();
  const screen = await render(panel({}, onChange));
  await screen.getByRole("combobox", { name: "Brand" }).fill("nor");
  await page.getByRole("option", { name: "Norra" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ brand: "Norra" });

  const withModels = { ...options, model: facet(["Fjell", "Vik"]) };
  await screen.rerender(panel({ brand: "Norra" }, onChange, withModels));
  const model = screen.getByRole("combobox", { name: "Model" });
  await expect.element(model).not.toBeDisabled();
  await model.click();
  await expect.element(page.getByRole("option", { name: "Vik" })).toBeVisible();
  await page.getByRole("option", { name: "Vik" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ brand: "Norra", model: "Vik" });

  await screen.rerender(panel({ brand: "Norra", model: "Vik" }, onChange, withModels));
  await screen.getByRole("combobox", { name: "Brand" }).fill("ald");
  await page.getByRole("option", { name: "Aldo" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ brand: "Aldo" });
});

test("only offers values that are in stock", async () => {
  const screen = await render(
    panel({}, () => {}, { ...options, bodyType: facet(["suv", "wagon"]), powertrain: facet(["diesel"]), seats: [5], towHitch: false }),
  );
  await expect.element(screen.getByRole("button", { name: "SUV" })).toBeVisible();
  await expect.element(screen.getByRole("button", { name: "Coupe" })).not.toBeInTheDocument();
  await expect.element(screen.getByRole("button", { name: "Diesel" })).toBeVisible();
  await expect.element(screen.getByRole("button", { name: "Electric" })).not.toBeInTheDocument();
  await expect.element(screen.getByRole("switch", { name: "Tow hitch" })).not.toBeInTheDocument();
});

test("the summary shows the count and chips that remove one filter or all of them", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <FilterProvider
      value={{ state: { filters: { powertrain: "electric", towHitch: true, minSeats: 5 }, options, resultCount: 1 }, actions: { change: onChange } }}
    >
      <FilterSummary />
    </FilterProvider>,
  );
  await expect.element(screen.getByText("1 car")).toBeVisible();
  await screen.getByRole("button", { name: "Remove filter Electric" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ towHitch: true, minSeats: 5 });
  await screen.getByRole("button", { name: "Clear all" }).click();
  expect(onChange).toHaveBeenLastCalledWith({});
});
