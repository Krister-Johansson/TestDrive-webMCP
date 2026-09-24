import { reseed } from "./seed";
import { expect, test } from "@playwright/test";

test.beforeAll(() => {
  reseed();
});

test.describe("admin", () => {
  test("adds a brand and model, then a car that uses them, and sees it bookable", async ({ page }) => {
    await page.goto("/admin?tab=brands");
    await expect(page.getByRole("heading", { level: 1, name: "Admin" })).toBeVisible();
    await page.getByRole("textbox", { name: "New brand" }).fill("Volvo");
    await page.getByRole("button", { name: "Add brand" }).click();
    await expect(page.getByRole("heading", { name: "Volvo" })).toBeVisible();
    await page.getByRole("textbox", { name: "New model for Volvo" }).fill("V70");
    await page.getByRole("button", { name: "Add model to Volvo" }).click();
    await expect(page.getByText("V70", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Cars" }).click();
    await page.getByRole("button", { name: "Add car" }).click();
    const dialog = page.getByRole("dialog");
    const picker = dialog.getByRole("combobox", { name: "Brand and model" });
    await picker.fill("v7");
    await page.getByRole("option", { name: "V70" }).click();
    await dialog.getByRole("spinbutton", { name: "Year" }).fill("2026");
    await dialog.getByRole("combobox", { name: "Color" }).click();
    await page.getByRole("option", { name: "Orange" }).click();
    await dialog.getByRole("textbox", { name: "Features" }).fill("heated seats");
    await dialog.getByRole("button", { name: "Save car" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("row", { name: /Volvo V70/ })).toBeVisible();

    await page.getByRole("tab", { name: "Slots" }).click();
    await page.getByRole("combobox", { name: "Car" }).click();
    await page.getByRole("option", { name: "Volvo V70" }).click();
    const from = page.getByLabel("From");
    const to = page.getByLabel("To", { exact: true });
    const day = new Date();
    day.setDate(day.getDate() + 30);
    const iso = day.toISOString().slice(0, 10);
    await from.fill(iso);
    await to.fill(iso);
    await page.getByRole("button", { name: "Generate slots" }).click();
    await expect(page.getByText(/10 slots added/)).toBeVisible();

    await page.goto("/");
    await page.getByRole("combobox", { name: "Brand" }).fill("vol");
    await page.getByRole("option", { name: "Volvo" }).click();
    await expect(page).toHaveURL(/brand=Volvo/);
    await page.getByRole("combobox", { name: "Model" }).click();
    await page.getByRole("option", { name: "V70" }).click();
    await expect(page).toHaveURL(/model=V70/);
    await expect(page.getByText("1 car")).toBeVisible();
    await page.getByRole("link", { name: /Volvo V70/ }).click();
    await expect(page.getByRole("dialog", { name: "Book a test drive" }).getByRole("heading", { name: "Volvo V70" })).toBeVisible();
    const url = page.url();
    await page.goto(`${url}?date=${iso}`);
    await expect(page.getByRole("button", { name: /^09:00/ })).toBeVisible();
  });

  test("cancels a booking from the bookings tab", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Norra Skog/ }).click();
    await page.getByRole("button", { name: /^\d\d:\d\d to \d\d:\d\d$/ }).first().click();
    await page.getByRole("dialog").getByRole("textbox", { name: "Name" }).fill("Linus Admin");
    await page.getByRole("dialog").getByRole("button", { name: "Confirm booking" }).click();
    await expect(page.getByRole("dialog").getByText("Booked!")).toBeVisible();

    await page.goto("/admin?tab=bookings");
    const row = page.getByRole("row", { name: /Linus Admin/ }).first();
    await expect(row).toContainText("confirmed");
    await row.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel booking" }).click();
    await expect(page.getByRole("row", { name: /Linus Admin/ }).first()).toContainText("cancelled");
  });
});
