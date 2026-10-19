import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { reseed } from "./seed";

/** WCAG 2.0, 2.1, and 2.2 level A and AA rules. Best-practice rules are left out on purpose. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Waits until CSS and Web Animations settle, so contrast is measured on the final colors. */
async function settle(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));
}

/**
 * Scans the page and records every violation as a soft failure, so one run lists all states.
 * `skip` turns off named rules for one state only; each use says why.
 */
async function expectAccessible(page: Page, state: string, skip: string[] = []) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).disableRules(skip).analyze();
  const report = violations.map(
    (violation) =>
      `${violation.id}: ${violation.help}\n` +
      violation.nodes.map((node) => `    ${node.target.join(" ")}\n      ${node.failureSummary?.replace(/\n/g, "\n      ")}`).join("\n"),
  );
  expect.soft(report, `axe violations in ${state}`).toEqual([]);
}

const FREE_SLOT = /^\d\d:\d\d to \d\d:\d\d$/;

test.beforeAll(() => {
  reseed();
});

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme, reducedMotion: "reduce" });

    test("browse page in both views, with filters, popups, and the help dialog", async ({ page, context }) => {
      await page.goto("/?powertrain=electric");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      await expectAccessible(page, "/ cards with a filter chip");

      await page.getByRole("combobox", { name: "Brand" }).click();
      await expect(page.getByRole("listbox")).toBeVisible();
      // Base UI hides the rest of the page from assistive tech while the list is open and focus
      // stays in the input; Tab closes the list first (covered in a11y-behavior.spec.ts).
      await expectAccessible(page, "/ brand combobox open", ["aria-hidden-focus"]);
      await page.keyboard.press("Escape");

      await page.getByRole("combobox", { name: "Seats" }).click();
      await expect(page.getByRole("listbox")).toBeVisible();
      // The open list covers part of a filter pill underneath; that pill cannot be used until the list closes.
      await expectAccessible(page, "/ seats select open", ["target-size"]);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "How to enable WebMCP" }).click();
      await expect(page.getByRole("dialog", { name: "Enable WebMCP in Chrome" })).toBeVisible();
      await expectAccessible(page, "help dialog");
      await page.keyboard.press("Escape");

      await context.addCookies([{ name: "testdrive.results-view.v1", value: "table", url: page.url() }]);
      await page.goto("/");
      await expect(page.getByRole("table")).toBeVisible();
      await expectAccessible(page, "/ table view");
    });

    test("browse page at 320 px with the filter sheet", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectAccessible(page, "/ at 320 px");
      await page.getByRole("button", { name: /^Filters/ }).click();
      await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
      await expectAccessible(page, "/ filter sheet");
    });

    test("admin tabs at 320 px, where the tables scroll inside their own box", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      for (const tab of ["cars", "brands", "slots", "bookings"]) {
        await page.goto(`/admin?tab=${tab}`);
        await expect(page.getByRole("heading", { level: 1, name: "Admin" })).toBeVisible();
        await expectAccessible(page, `/admin ${tab} at 320 px`);
      }
    });

    test("booking modal, confirm sheet with an error, booked state, and the booking page", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("link", { name: /Aldo Sera/ }).click();
      const modal = page.getByRole("dialog", { name: "Book a test drive" });
      await expect(modal.getByRole("heading", { name: "Aldo Sera" })).toBeVisible();
      await expectAccessible(page, "car modal");

      await page.getByRole("button", { name: FREE_SLOT }).first().click();
      const sheet = page.getByRole("dialog", { name: "Confirm your test drive" });
      await expect(sheet).toBeVisible();
      await sheet.getByRole("button", { name: "Confirm booking" }).click();
      await expect(sheet.getByText("Name is required.")).toBeVisible();
      await expectAccessible(page, "confirm sheet with a name error");

      await sheet.getByRole("textbox", { name: "Name" }).fill("Axe Tester");
      await sheet.getByRole("button", { name: "Confirm booking" }).click();
      await expect(page.getByText("Booked!")).toBeVisible();
      await expectAccessible(page, "booked view");

      await page.getByRole("link", { name: "View booking" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toContainText(/confirmed/i);
      await expectAccessible(page, "/bookings/[id]");

      await page.getByRole("button", { name: "Cancel booking" }).click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await expectAccessible(page, "cancel booking alert dialog");
    });

    test("full car page", async ({ page }) => {
      await page.goto("/");
      const href = await page.getByRole("link", { name: /Kestrel Lane/ }).first().getAttribute("href");
      await page.goto(href!);
      await expect(page.getByRole("heading", { level: 1, name: "Kestrel Lane" })).toBeVisible();
      await expectAccessible(page, "/book/[carId]");
    });

    test("admin tabs, car dialog with errors, and the slot generator", async ({ page }) => {
      await page.goto("/admin");
      await expect(page.getByRole("heading", { level: 1, name: "Admin" })).toBeVisible();
      await expectAccessible(page, "/admin cars");

      await page.getByRole("button", { name: "Add car" }).click();
      const dialog = page.getByRole("dialog", { name: "Add a car" });
      await dialog.getByRole("spinbutton", { name: "Seats" }).fill("0");
      await dialog.getByRole("button", { name: "Save car" }).click();
      await expect(dialog.getByText("Seats must be at least 1.")).toBeVisible();
      await expectAccessible(page, "add car dialog with errors");
      await dialog.getByRole("button", { name: "Cancel" }).click();

      for (const tab of ["Brands", "Slots", "Bookings"]) {
        await page.getByRole("tab", { name: tab }).click();
        await expect(page).toHaveURL(new RegExp(`tab=${tab.toLowerCase()}`));
        await expectAccessible(page, `/admin ${tab}`);
      }

      await page.getByRole("tab", { name: "Slots" }).click();
      const day = new Date();
      day.setDate(day.getDate() + 40);
      const iso = day.toISOString().slice(0, 10);
      await page.getByLabel("From").fill(iso);
      await page.getByLabel("To", { exact: true }).fill(iso);
      await page.getByRole("button", { name: "Generate slots" }).click();
      await expect(page.getByText(/slots added/)).toBeVisible();
      await expectAccessible(page, "slot generator result");
    });

    test("WebMCP header, tools popover, and agent activity feed", async ({ page }) => {
      await page.addInitScript({ path: path.join(process.cwd(), "tests", "model-context-stub.js") });
      await page.goto("/");
      await expect(page.getByText("Native")).toBeVisible();
      await page.getByRole("button", { name: /\d+ tools/ }).click();
      await expect(page.getByText("Tools registered on this page")).toBeVisible();
      await expectAccessible(page, "WebMCP tools popover");
      await page.keyboard.press("Escape");

      await page.evaluate(() =>
        (window as unknown as { __modelContextStub: { executeTool(n: string, a: unknown): Promise<unknown> } }).__modelContextStub.executeTool(
          "list_available_slots",
          { car: "No such car", date: "2026-10-20" },
        ),
      );
      await expect(page.getByRole("log", { name: "Agent activity" }).getByLabel("Failed")).toBeVisible();
      await expectAccessible(page, "agent activity feed");
    });

    test("connect page and not-found page", async ({ page }) => {
      await page.goto("/connect");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectAccessible(page, "/connect");

      await page.goto("/no-such-page");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectAccessible(page, "not-found");
    });
  });
}
