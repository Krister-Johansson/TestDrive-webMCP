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

test("the header toggle registers tools, persists, and tools drive the page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Native")).toBeVisible();
  const toggle = page.getByRole("switch", { name: "WebMCP" });
  await expect(toggle).not.toBeChecked();
  expect(await toolNames(page)).toEqual([]);

  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(page.getByRole("button", { name: /7 tools/ })).toBeVisible();
  expect(await toolNames(page)).toEqual([
    "book_test_drive",
    "cancel_booking",
    "filter_cars",
    "find_cars",
    "get_booking",
    "list_available_slots",
    "select_car",
  ]);

  await page.reload();
  await expect(page.getByRole("switch", { name: "WebMCP" })).toBeChecked();
  await expect(page.getByRole("button", { name: /7 tools/ })).toBeVisible();

  const filtered = (await executeTool(page, "filter_cars", { powertrain: "electric" })) as { content: { text: string }[] };
  expect(filtered.content[0].text).toContain("3 cars");
  await expect(page).toHaveURL(/powertrain=electric/);
  await expect(page.getByText("3 cars")).toBeVisible();

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

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("switch", { name: "WebMCP" }).click();
  await expect.poll(() => toolNames(page)).toEqual([]);
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
