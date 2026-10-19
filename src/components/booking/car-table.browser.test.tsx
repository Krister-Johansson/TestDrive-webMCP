import { beforeEach, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { DEFAULT_TABLE_LAYOUT, TABLE_LAYOUT_COOKIE } from "@/lib/car-table-layout";
import { makeCar } from "../../../tests/fixtures";
import { CarTable } from "./car-table";

// Seeds 0 to 4: Norra Fjell (electric), Norra Vik (plug-in hybrid), Norra Skog (hybrid), Aldo Cinque and Aldo Sera (petrol).
const cars = [0, 1, 2, 3, 4].map((index) => makeCar({}, index));
const headers = () =>
  page
    .getByRole("columnheader")
    .elements()
    .map((th) => th.getAttribute("data-column-id"));

beforeEach(() => {
  document.cookie = `${TABLE_LAYOUT_COOKIE}=; path=/; max-age=0`;
});

test("starts with the default columns, brand hidden, Book last", async () => {
  await render(<CarTable cars={cars} layout={DEFAULT_TABLE_LAYOUT} />);
  await expect.element(page.getByRole("columnheader", { name: /Year/ })).toBeVisible();
  expect(headers()).toEqual(["car", "year", "body", "powertrain", "gearbox", "drive", "seats", "towHitch", "color", "actions"]);
});

test("the Columns menu hides and shows a column and remembers it in a cookie", async () => {
  await render(<CarTable cars={cars} layout={DEFAULT_TABLE_LAYOUT} />);
  await page.getByRole("button", { name: "Columns" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Year" }).click();
  await expect.element(page.getByRole("columnheader", { name: /Year/ })).not.toBeInTheDocument();
  expect(decodeURIComponent(document.cookie)).toContain('"hidden":["brand","year"]');

  await page.getByRole("menuitemcheckbox", { name: "Brand" }).click();
  await expect.element(page.getByRole("columnheader", { name: /Brand/ })).toBeVisible();
  await expect.element(page.getByRole("menuitemcheckbox", { name: "Car" })).toHaveAttribute("aria-disabled", "true");
});

test("a column's menu moves it left and right without dragging", async () => {
  await render(<CarTable cars={cars} layout={DEFAULT_TABLE_LAYOUT} />);
  await page.getByRole("button", { name: "Year column options" }).click();
  await page.getByRole("menuitem", { name: "Move right" }).click();
  await expect.poll(headers).toEqual(["car", "body", "year", "powertrain", "gearbox", "drive", "seats", "towHitch", "color", "actions"]);

  await page.getByRole("button", { name: "Year column options" }).click();
  await page.getByRole("menuitem", { name: "Hide column" }).click();
  await expect.element(page.getByRole("columnheader", { name: /Year/ })).not.toBeInTheDocument();
});

test("the resize handle works from the keyboard", async () => {
  await render(<CarTable cars={cars} layout={DEFAULT_TABLE_LAYOUT} />);
  const handle = page.getByRole("separator", { name: "Resize Year column" });
  const before = Number(handle.element().getAttribute("aria-valuenow"));
  handle.element().focus();
  await userEvent.keyboard("{ArrowRight}{ArrowRight}");
  await expect.element(handle).toHaveAttribute("aria-valuenow", String(before + 32));
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(handle).toHaveAttribute("aria-valuenow", String(before + 16));
  expect(decodeURIComponent(document.cookie)).toContain(`"year":${before + 16}`);
});

test("grouping shows one collapsible row per value with its count", async () => {
  await render(<CarTable cars={cars} layout={DEFAULT_TABLE_LAYOUT} group="powertrain" />);
  const petrol = page.getByRole("button", { name: /Petrol.*2 cars/ });
  await expect.element(petrol).toHaveAttribute("aria-expanded", "true");
  await expect.element(page.getByRole("button", { name: /Electric.*1 car$/ })).toBeVisible();
  await expect.element(page.getByRole("link", { name: "Aldo Cinque" }).first()).toBeVisible();

  await petrol.click();
  await expect.element(petrol).toHaveAttribute("aria-expanded", "false");
  await expect.element(page.getByRole("link", { name: "Aldo Cinque" })).not.toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: "Norra Fjell" }).first()).toBeVisible();
});

test("the Group by menu links keep the current query", async () => {
  await render(<CarTable cars={cars} layout={DEFAULT_TABLE_LAYOUT} currentQuery="powertrain=petrol&sort=year&order=asc" />);
  await page.getByRole("button", { name: /Group by/ }).click();
  await expect
    .element(page.getByRole("menuitem", { name: "Body" }))
    .toHaveAttribute("href", "/?powertrain=petrol&sort=year&order=asc&group=body");
  await expect.element(page.getByRole("menuitem", { name: "None" })).toHaveAttribute("href", "/?powertrain=petrol&sort=year&order=asc");
});
