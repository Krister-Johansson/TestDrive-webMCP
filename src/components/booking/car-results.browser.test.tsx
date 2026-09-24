import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { CarResults } from "./car-results";
import { makeCar } from "../../../tests/fixtures";

const cars = [makeCar({}, 0), makeCar({ id: "car2", modelId: "m2" }, 3)];

test("renders cards or a table depending on the chosen view", async () => {
  const screen = await render(<CarResults cars={cars} view="cards" />);
  await expect.element(screen.getByRole("heading", { name: "Norra Fjell" })).toBeVisible();
  await expect.element(screen.getByRole("table")).not.toBeInTheDocument();

  await screen.rerender(<CarResults cars={cars} view="table" />);
  await expect.element(screen.getByRole("table")).toBeVisible();
  await expect.element(screen.getByRole("row", { name: /Aldo Cinque/ })).toBeVisible();
  await expect.element(screen.getByRole("heading", { name: "Norra Fjell" })).not.toBeInTheDocument();
});
