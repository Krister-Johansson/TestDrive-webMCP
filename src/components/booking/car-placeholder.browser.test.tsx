import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { CarPlaceholder } from "./car-placeholder";
import { makeCar } from "../../../tests/fixtures";

test("renders brand, model, and body type with an id-derived background", async () => {
  const screen = await render(<CarPlaceholder car={makeCar({ id: "8QGw0-wl-Y" })} />);
  const img = screen.getByRole("img", { name: "Norra Fjell" });
  await expect.element(img).toBeVisible();
  await expect.element(screen.getByText("NORRA")).toBeVisible();
  await expect.element(screen.getByText("Fjell")).toBeVisible();
  await expect.element(screen.getByText(/SUV/)).toBeVisible();
  const first = (screen.container.querySelector("svg") as SVGElement).style.background;
  const other = await render(<CarPlaceholder car={makeCar({ id: "other-id" })} />);
  const second = (other.container.querySelector("svg") as SVGElement).style.background;
  expect(first).toMatch(/rgb/);
  expect(second).not.toBe(first);
});

test("draws its text at full opacity, so the palette contrast is the contrast people see", async () => {
  const screen = await render(<CarPlaceholder car={makeCar()} />);
  const texts = screen.container.querySelectorAll("text");
  expect(texts.length).toBeGreaterThan(0);
  for (const text of texts) expect(getComputedStyle(text).opacity).toBe("1");
});
