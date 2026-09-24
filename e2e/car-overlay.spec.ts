import { reseed } from "./seed";
import { expect, test } from "@playwright/test";

test.beforeAll(() => {
  reseed();
});

test("a car opens in a modal at its own URL, and the same URL opens the full page in a new tab", async ({ page, context }) => {
  await page.goto("/?brand=Norra");
  await page.getByRole("link", { name: /Norra Skog/ }).click();
  await expect(page).toHaveURL(/\/book\/[A-Za-z0-9_-]+$/);
  const modal = page.getByRole("dialog", { name: "Book a test drive" });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("heading", { name: "Norra Skog" })).toBeVisible();
  await expect(modal.getByRole("button", { name: /^\d\d:\d\d to \d\d:\d\d$/ }).first()).toBeVisible();
  // The list is still underneath.
  await expect(page.locator("main")).toContainText("Norra Fjell");

  // Picking another day in the calendar keeps the modal open.
  await modal.locator('[role="grid"] button:not([disabled])').nth(1).click();
  await expect(page).toHaveURL(/\/book\/[A-Za-z0-9_-]+\?date=\d{4}-\d{2}-\d{2}$/);
  await expect(page.getByRole("dialog", { name: "Book a test drive" })).toBeVisible();

  // The URL works on its own, as a full page without the list.
  const shareUrl = page.url();
  const tab = await context.newPage();
  await tab.goto(shareUrl);
  await expect(tab.getByRole("dialog")).toHaveCount(0);
  await expect(tab.getByRole("heading", { level: 1, name: "Norra Skog" })).toBeVisible();
  await expect(tab.getByRole("link", { name: "All cars" })).toBeVisible();
  await expect(tab.getByText("Norra Fjell")).toHaveCount(0);
  await tab.close();

  // Closing goes back to the filtered list.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/\?brand=Norra$/);
  await expect(page.getByRole("button", { name: "Remove filter Norra" })).toBeVisible();
});

test("booking from the modal flips the slot behind the confirm sheet", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Aldo Cinque/ }).click();
  const modal = page.getByRole("dialog", { name: "Book a test drive" });
  const free = modal.getByRole("button", { name: /^\d\d:\d\d to \d\d:\d\d$/ }).first();
  const time = ((await free.textContent()) ?? "").slice(0, 5);
  await free.click();
  const confirm = page.getByRole("dialog").last();
  await confirm.getByRole("textbox", { name: "Name" }).fill("Modal Maja");
  await confirm.getByRole("button", { name: "Confirm booking" }).click();
  await expect(confirm.getByText("Booked!")).toBeVisible();
  await confirm.getByRole("button", { name: "Done" }).click();
  await expect(modal.getByRole("button", { name: new RegExp(`^${time}`) })).toBeDisabled({ timeout: 10_000 });
});

test("navigating elsewhere from the modal closes it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Kestrel Lane/ }).click();
  await expect(page.getByRole("dialog", { name: "Book a test drive" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
