import { beforeEach, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { CarResults, RESULTS_VIEW_KEY, ResultsViewToggle } from "./car-results";
import { makeCar } from "../../../tests/fixtures";

const cars = [makeCar({}, 0), makeCar({ id: "car2", modelId: "m2" }, 3)];

beforeEach(() => localStorage.removeItem(RESULTS_VIEW_KEY));

test("switches between cards and a table and remembers the choice", async () => {
  const screen = await render(
    <div>
      <ResultsViewToggle />
      <CarResults cars={cars} />
    </div>,
  );
  await expect.element(screen.getByRole("heading", { name: "Norra Fjell" })).toBeVisible();
  await expect.element(screen.getByRole("table")).not.toBeInTheDocument();

  await screen.getByRole("button", { name: "Table" }).click();
  await expect.element(screen.getByRole("table")).toBeVisible();
  await expect.element(screen.getByRole("row", { name: /Aldo Cinque/ })).toBeVisible();
  await expect.element(screen.getByRole("heading", { name: "Norra Fjell" })).not.toBeInTheDocument();
  expect(localStorage.getItem(RESULTS_VIEW_KEY)).toBe("table");

  await screen.getByRole("button", { name: "Cards" }).click();
  await expect.element(screen.getByRole("heading", { name: "Norra Fjell" })).toBeVisible();
});
