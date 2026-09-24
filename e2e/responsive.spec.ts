import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

for (const path of ["/", "/admin", "/connect"]) {
  test(`${path} has no horizontal scroll at phone width`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("on a desktop the results scroll, not the window", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Norra Fjell/ })).toBeVisible();
  const before = await page.evaluate(() => ({
    doc: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    viewport: document.querySelector('[data-slot="scroll-area-viewport"]')!.scrollHeight - document.querySelector('[data-slot="scroll-area-viewport"]')!.clientHeight,
  }));
  expect(before.doc).toBeLessThanOrEqual(2);
  expect(before.viewport).toBeGreaterThan(100);
  await page.getByRole("link", { name: /Norra Fjell/ }).hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => document.querySelector('[data-slot="scroll-area-viewport"]')!.scrollTop)).toBeGreaterThan(200);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("on a short window the page grows to the filter panel and the results match its height", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 640 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Norra Fjell/ })).toBeVisible();
  const m = await page.evaluate(() => {
    const aside = document.querySelector("aside")!.getBoundingClientRect();
    const results = document.querySelector('[data-slot="scroll-area"]')!.getBoundingClientRect();
    const asideScroll = document.querySelector("aside")!.scrollHeight - document.querySelector("aside")!.clientHeight;
    return { doc: document.documentElement.scrollHeight - document.documentElement.clientHeight, asideH: aside.height, resultsH: results.height, asideScroll };
  });
  expect(m.asideScroll).toBeLessThanOrEqual(1);
  expect(m.doc).toBeGreaterThan(50);
  expect(Math.abs(m.asideH - m.resultsH)).toBeLessThanOrEqual(2);
});

test("the booking page fits a phone and the sheet opens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Kestrel Lane/ }).click();
  await expect(page.getByRole("dialog", { name: "Book a test drive" }).getByRole("heading", { name: "Kestrel Lane" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: /^\d\d:\d\d to \d\d:\d\d$/ }).first().click();
  await expect(page.getByRole("dialog").last()).toBeVisible();
});
