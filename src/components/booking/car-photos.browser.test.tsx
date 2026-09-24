import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { CarPhotos } from "./car-photos";
import { makeCar } from "../../../tests/fixtures";

const images = [
  { id: "i1", carId: "car1", url: "https://upload.wikimedia.org/a.jpg", credit: "Photo: Ann (CC BY 4.0), Wikimedia Commons", sourceUrl: "https://commons.wikimedia.org/wiki/File:a.jpg", sortOrder: 0, createdAt: 0 },
  { id: "i2", carId: "car1", url: "https://upload.wikimedia.org/b.jpg", credit: "Photo: Bo (CC0), Wikimedia Commons", sourceUrl: null, sortOrder: 1, createdAt: 0 },
];

test("shows the generated placeholder when a car has no photos", async () => {
  const screen = await render(<CarPhotos car={makeCar()} variant="card" />);
  await expect.element(screen.getByRole("img", { name: "Norra Fjell" })).toBeVisible();
  await expect.element(screen.getByText("Fjell")).toBeVisible();
  expect(document.querySelector("img")).toBeNull();
});

test("shows the photos as a carousel with dots and a credit link", async () => {
  const screen = await render(<CarPhotos car={makeCar({ images })} />);
  await expect.element(screen.getByRole("img", { name: "Norra Fjell, photo 1 of 2" })).toBeVisible();
  await expect.element(screen.getByRole("tab", { name: "Photo 1" })).toHaveAttribute("aria-selected", "true");
  await expect.element(screen.getByRole("link", { name: /Photo: Ann/ })).toHaveAttribute("href", "https://commons.wikimedia.org/wiki/File:a.jpg");
  await screen.getByRole("button", { name: "Next slide" }).click();
  await expect.element(screen.getByRole("tab", { name: "Photo 2" })).toHaveAttribute("aria-selected", "true");
  await expect.element(screen.getByText(/Photo: Bo/)).toBeVisible();
});

test("the card variant has no caption and its photo links stay out of the accessibility tree", async () => {
  const screen = await render(<CarPhotos car={makeCar({ images })} variant="card" href="/book/car1" />);
  await expect.element(screen.getByRole("img", { name: "Norra Fjell, photo 1 of 2" })).toBeVisible();
  await expect.element(screen.getByText(/Photo: Ann/)).not.toBeInTheDocument();
  await expect.element(screen.getByRole("link")).not.toBeInTheDocument();
  expect(document.querySelectorAll('a[href="/book/car1"]')).toHaveLength(2);
});
