import path from "node:path";
import { reseed } from "./seed";
import { expect, test, type Page } from "@playwright/test";

const STUB = path.join(process.cwd(), "tests", "model-context-stub.js");

async function toolNames(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    (window as unknown as { __modelContextStub: { getTools(): { name: string }[] } }).__modelContextStub
      .getTools()
      .map((tool) => tool.name)
      .sort(),
  );
}

async function executeTool(page: Page, name: string, args: Record<string, unknown>) {
  return page.evaluate(
    ([toolName, toolArgs]) =>
      (window as unknown as { __modelContextStub: { executeTool(n: string, a: unknown): Promise<unknown> } }).__modelContextStub.executeTool(
        toolName as string,
        toolArgs,
      ),
    [name, args] as const,
  );
}

test.beforeAll(() => {
  reseed();
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: STUB });
});

test("tools register on load without a toggle and drive the page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Native")).toBeVisible();
  await expect(page.getByRole("switch", { name: "WebMCP" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /8 tools/ })).toBeVisible();
  expect(await toolNames(page)).toEqual([
    "arrange_cars",
    "book_test_drive",
    "cancel_booking",
    "filter_cars",
    "find_cars",
    "get_booking",
    "list_available_slots",
    "select_car",
  ]);

  const filtered = (await executeTool(page, "filter_cars", { powertrain: "electric" })) as { content: { text: string }[] };
  expect(filtered.content[0].text).toContain("3 cars");
  await expect(page).toHaveURL(/powertrain=electric/);
  await expect(page.getByText("3 cars", { exact: true })).toBeVisible();
  const feed = page.getByRole("log", { name: "Agent activity" });
  await expect(feed.getByText("filter_cars")).toBeVisible();
  await expect(feed.getByText("powertrain: electric")).toBeVisible();

  const arranged = (await executeTool(page, "arrange_cars", { sortBy: "year", order: "desc", groupBy: "drive" })) as {
    content: { text: string }[];
  };
  expect(arranged.content[0].text).toBe("Showing 3 cars as a table, sorted by year (descending), grouped by drive into 2 groups.");
  await expect(page).toHaveURL(/powertrain=electric/);
  await expect(page).toHaveURL(/sort=year&order=desc&group=drive/);
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("button", { name: /Drive: AWD.*2 cars/ })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /Year/ })).toHaveAttribute("aria-sort", "descending");

  await executeTool(page, "arrange_cars", { view: "cards", groupBy: "none" });
  await expect(page).not.toHaveURL(/group=/);
  await expect(page.getByRole("table")).toHaveCount(0);

  const opened = (await executeTool(page, "select_car", { car: "Norra Vik" })) as { content: { text: string }[] };
  expect(opened.content[0].text).toContain("Norra Vik");
  await expect(page).toHaveURL(/\/book\//);
  await expect(page.getByRole("dialog", { name: "Book a test drive" }).getByRole("heading", { name: "Norra Vik" })).toBeVisible();
  await expect.poll(() => toolNames(page)).toContain("select_slot");

  const firstFree = page.getByRole("button", { name: /^\d\d:\d\d to \d\d:\d\d$/ }).first();
  const slotId = await firstFree.getAttribute("data-slot-id");
  const time = ((await firstFree.textContent()) ?? "").slice(0, 5);
  const selected = (await executeTool(page, "select_slot", { slotId })) as { content: { text: string }[] };
  expect(selected.content[0].text).toContain(time);
  await expect(page.getByRole("dialog").last()).toContainText(time);

  const booked = (await executeTool(page, "book_test_drive", { slotId, customerName: "Agent Smith" })) as { content: { text: string }[] };
  expect(booked.content[0].text).toContain("confirmed");
  await expect(page.getByRole("button", { name: new RegExp(`^${time}`) })).toBeDisabled({ timeout: 10_000 });

  // Closing the modal unmounts the booking view, so its page tool goes away again.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(() => toolNames(page)).not.toContain("select_slot");
});

test("the connect page explains all three ways in", async ({ page }) => {
  await page.goto("/connect");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/connect/i);
  await expect(page.getByText("claude mcp add --transport http testdrive")).toBeVisible();
  await expect(page.getByText(/"mcp-remote"/)).toBeVisible();
  await expect(page.getByText("Native").first()).toBeVisible();
  await expect(page.getByText("find_cars").first()).toBeVisible();
  await expect(page.getByText("chrome://flags/#enable-webmcp-testing").first()).toBeVisible();
});
