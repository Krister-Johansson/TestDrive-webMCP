import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { CarCard } from "./car-card";
import { makeCar } from "../../../tests/fixtures";

const car = makeCar();

test("shows the car's key properties and links to its booking page", async () => {
  const screen = await render(<CarCard car={car} />);
  await expect.element(screen.getByRole("heading", { name: "Norra Fjell" })).toBeVisible();
  await expect.element(screen.getByText("2026")).toBeVisible();
  await expect.element(screen.getByText("Electric")).toBeVisible();
  await expect.element(screen.getByText("SUV")).toBeVisible();
  await expect.element(screen.getByText("Automatic")).toBeVisible();
  await expect.element(screen.getByText("7 seats")).toBeVisible();
  await expect.element(screen.getByText("Tow hitch")).toBeVisible();
  await expect.element(screen.getByText("panoramic roof")).toBeVisible();
  const link = screen.getByRole("link", { name: /Norra Fjell/ });
  await expect.element(link).toHaveAttribute("href", "/book/car1");
  expect(document.querySelectorAll("a")).toHaveLength(1);
});

test("says so when the car has no tow hitch", async () => {
  const screen = await render(<CarCard car={{ ...car, towHitch: false }} />);
  await expect.element(screen.getByText("Tow hitch", { exact: true })).not.toBeInTheDocument();
  await expect.element(screen.getByText("No tow hitch")).toBeVisible();
});
