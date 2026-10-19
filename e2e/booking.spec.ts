import { reseed } from "./seed";
import { expect, test, type Page } from "@playwright/test";

test.beforeAll(() => {
  reseed();
});

async function openFirstFreeSlot(page: Page) {
  const free = page.getByRole("button", { name: /^\d\d:\d\d to \d\d:\d\d$/ }).first();
  await expect(free).toBeVisible();
  const label = (await free.textContent()) ?? "";
  await free.click();
  return label.slice(0, 5);
}

test.describe("home page", () => {
  test("lists the fleet and filters through the URL", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/test drive/i);
    await expect(page.getByRole("link", { name: /Norra Fjell/ })).toBeVisible();
    await expect(page.getByText("8 cars")).toBeVisible();

    await page.getByRole("button", { name: "Electric" }).click();
    await expect(page).toHaveURL(/powertrain=electric/);
    await expect(page.getByText("3 cars")).toBeVisible();

    await page.getByRole("switch", { name: "Tow hitch" }).click();
    await expect(page).toHaveURL(/towHitch=true/);
    await expect(page.getByText("2 cars")).toBeVisible();
    await expect(page.getByRole("link", { name: /Norra Fjell/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Kestrel Heath/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Kestrel Lane/ })).toHaveCount(0);

    await page.reload();
    await expect(page.getByText("2 cars")).toBeVisible();

    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("8 cars")).toBeVisible();
  });

  test("sorts the table by a column and keeps the order while filtering", async ({ page, context }) => {
    await page.goto("/");
    await context.addCookies([{ name: "testdrive.results-view.v1", value: "table", url: page.url() }]);
    await page.reload();
    const firstCar = () => page.getByRole("table").getByRole("row").nth(1).getByRole("link").first();

    await page.getByRole("link", { name: "Year" }).click();
    await expect(page).toHaveURL(/sort=year&order=asc/);
    await expect(page.getByRole("columnheader", { name: /Year/ })).toHaveAttribute("aria-sort", "ascending");
    await expect(firstCar()).toHaveText("Aldo Cinque");

    await page.getByRole("link", { name: "Year" }).click();
    await expect(page).toHaveURL(/sort=year&order=desc/);
    await expect(page.getByRole("columnheader", { name: /Year/ })).toHaveAttribute("aria-sort", "descending");
    await expect(firstCar()).toHaveText("Aldo Sera");

    await page.getByRole("button", { name: "Electric" }).click();
    await expect(page).toHaveURL(/powertrain=electric/);
    await expect(page).toHaveURL(/sort=year&order=desc/);
    await expect(page.getByText("3 cars", { exact: true })).toBeVisible();
    await expect(firstCar()).toHaveText("Kestrel Lane");
  });

  test("groups the table, hides and moves columns, and keeps the layout after a reload", async ({ page, context }) => {
    await page.goto("/");
    await context.addCookies([{ name: "testdrive.results-view.v1", value: "table", url: page.url() }]);
    await page.reload();
    const headerIds = () =>
      page.getByRole("columnheader").evaluateAll((cells) => cells.map((cell) => cell.getAttribute("data-column-id")));

    await page.getByRole("button", { name: /Group by/ }).click();
    await page.getByRole("menuitem", { name: "Powertrain" }).click();
    await expect(page).toHaveURL(/group=powertrain/);
    const electric = page.getByRole("button", { name: /Powertrain: Electric.*3 cars/ });
    await expect(electric).toHaveAttribute("aria-expanded", "true");
    await electric.click();
    await expect(electric).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("link", { name: "Kestrel Lane" })).toHaveCount(0);

    await page.getByRole("button", { name: "Columns" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Seats" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("columnheader", { name: /Seats/ })).toHaveCount(0);

    // Drag the Year header by its label past the Body header. Moving more than 5 px starts a drag, so the link does not sort.
    const from = (await page.getByRole("link", { name: "Year" }).boundingBox())!;
    const to = (await page.getByRole("columnheader", { name: /Body/ }).boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width * 0.75, from.y + from.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect(page).not.toHaveURL(/sort=year/);
    // The drop lands after dnd-kit's drop animation; wait for the saved layout, not the moved header cells.
    await expect
      .poll(async () => decodeURIComponent((await context.cookies()).find((c) => c.name === "testdrive.table-layout.v1")?.value ?? ""))
      .toContain('"order":["brand","car","body","year"');
    await expect.poll(headerIds).toEqual(["car", "body", "year", "powertrain", "gearbox", "drive", "towHitch", "color", "actions"]);
    // Body cells follow the headers: the first data row reads car, body, year.
    const firstRow = page.getByRole("row").filter({ has: page.getByRole("link", { name: "Book" }) }).first();
    await expect(firstRow.getByRole("cell").nth(1)).toHaveText(/^(SUV|Sedan|Wagon|Hatchback|Coupe)$/);
    await expect(firstRow.getByRole("cell").nth(2)).toHaveText(/^20\d\d$/);

    await page.reload();
    await expect(page.getByRole("button", { name: /Powertrain: Electric.*3 cars/ })).toBeVisible();
    await expect.poll(headerIds).toEqual(["car", "body", "year", "powertrain", "gearbox", "drive", "towHitch", "color", "actions"]);

    await page.getByRole("button", { name: "Columns" }).click();
    await page.getByRole("menuitem", { name: "Reset columns" }).click();
    await expect(page.getByRole("columnheader", { name: /Seats/ })).toBeVisible();
  });

  test("only offers filter values that are in stock", async ({ page }) => {
    await page.goto("/?brand=Kestrel");
    await expect(page.getByText("3 cars")).toBeVisible();
    await expect(page.getByRole("button", { name: "Hatchback" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "SUV" })).toBeVisible();
    await page.getByRole("combobox", { name: "Model" }).click();
    await expect(page.getByRole("option")).toHaveCount(3);
    await page.getByRole("option", { name: "Moor" }).click();
    await expect(page.getByText("1 car")).toBeVisible();
    await expect(page.getByRole("button", { name: "Wagon" })).toHaveCount(0);
  });

  test("shows an empty state when nothing matches", async ({ page }) => {
    await page.goto("/?bodyType=coupe&powertrain=electric");
    await expect(page.getByText("0 cars")).toBeVisible();
    await expect(page.getByText(/no cars match/i)).toBeVisible();
  });
});

test.describe("booking flow", () => {
  test("books a slot from the car page and shows the confirmation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Aldo Sera/ }).click();
    await expect(page).toHaveURL(/\/book\/[A-Za-z0-9_-]+$/);
    const modal = page.getByRole("dialog", { name: "Book a test drive" });
    await expect(modal.getByRole("heading", { name: "Aldo Sera" })).toBeVisible();
    await expect(modal.getByText("Rear-wheel drive")).toBeVisible();

    const time = await openFirstFreeSlot(page);
    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(time);
    await dialog.getByRole("textbox", { name: "Name" }).fill("Ada Lovelace");
    await dialog.getByRole("button", { name: "Confirm booking" }).click();
    await expect(dialog.getByText("Booked!")).toBeVisible();

    await dialog.getByRole("link", { name: "View booking" }).click();
    await expect(page).toHaveURL(/\/bookings\/[A-Za-z0-9_-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/confirmed/i);
    const summary = page.getByRole("main");
    await expect(summary.getByText("Ada Lovelace")).toBeVisible();
    await expect(summary.getByText("Aldo Sera", { exact: true })).toBeVisible();
    await expect(summary.getByText(time)).toBeVisible();

    await page.getByRole("button", { name: "Cancel booking" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel booking" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/cancelled/i);
  });

  test("updates other open tabs live when a slot is booked", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const a = await contextA.newPage();
    const b = await contextB.newPage();
    await a.goto("/");
    await a.getByRole("link", { name: /Kestrel Moor/ }).click();
    await expect(a).toHaveURL(/\/book\//);
    await expect(a.getByRole("dialog", { name: "Book a test drive" }).getByRole("heading", { name: "Kestrel Moor" })).toBeVisible();
    await b.goto(a.url());
    await expect(b.getByRole("heading", { level: 1, name: "Kestrel Moor" })).toBeVisible();
    await expect(b.getByRole("status", { name: "Live updates" })).toHaveAttribute("data-status", "open");

    const time = await openFirstFreeSlot(a);
    const confirm = a.getByRole("dialog").last();
    await confirm.getByRole("textbox", { name: "Name" }).fill("Grace Hopper");
    await confirm.getByRole("button", { name: "Confirm booking" }).click();
    await expect(confirm.getByText("Booked!")).toBeVisible();

    const bookedInB = b.getByRole("button", { name: new RegExp(`^${time}`) });
    await expect(bookedInB).toBeDisabled({ timeout: 10_000 });
    await expect(bookedInB).toContainText("Booked");
    await expect(b.getByText(/Kestrel Moor.*was just booked/)).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
