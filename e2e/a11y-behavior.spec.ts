import { expect, test, type Page } from "@playwright/test";
import { reseed } from "./seed";

/**
 * WCAG 2.2 AA checks that axe cannot make on its own: titles, keyboard paths, focus
 * return and visibility, reflow, text spacing, status messages, and reduced motion.
 */

const FREE_SLOT = /^\d\d:\d\d to \d\d:\d\d$/;

test.beforeAll(() => {
  reseed();
});

async function bookOne(page: Page, car: RegExp, name: string): Promise<string> {
  await page.goto("/");
  await page.getByRole("link", { name: car }).click();
  await page.getByRole("button", { name: FREE_SLOT }).first().click();
  const sheet = page.getByRole("dialog", { name: "Confirm your test drive" });
  await sheet.getByRole("textbox", { name: "Name" }).fill(name);
  await sheet.getByRole("button", { name: "Confirm booking" }).click();
  await page.getByRole("link", { name: "View booking" }).click();
  await expect(page).toHaveURL(/\/bookings\//);
  return new URL(page.url()).pathname;
}

async function carPath(page: Page, car: RegExp): Promise<string> {
  await page.goto("/");
  return (await page.getByRole("link", { name: car }).first().getAttribute("href"))!;
}

test("2.4.2 every route has a descriptive title and 3.1.1 the page language is English", async ({ page }) => {
  const booking = await bookOne(page, /Norra Vik/, "Title Check");
  const car = await carPath(page, /Kestrel Lane/);
  const expected: [string, string][] = [
    ["/", "Book a test drive · TestDrive"],
    [car, "Book Kestrel Lane · TestDrive"],
    [booking, "Booking · TestDrive"],
    ["/admin", "Admin · TestDrive"],
    ["/connect", "Connect an agent · TestDrive"],
    ["/no-such-page", "Page not found · TestDrive"],
  ];
  for (const [path, title] of expected) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  }
});

test("2.4.1 a skip link is the first tab stop and moves focus to the main content", async ({ page }) => {
  await page.goto("/admin");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  // The next stop is inside main, not back in the header.
  expect(await page.evaluate(() => document.activeElement?.closest("main") !== null)).toBe(true);
});

test.describe("2.4.3 focus order and focus return", () => {
  test("closing the car modal returns focus to the car link", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /Aldo Sera/ });
    await link.focus();
    await page.keyboard.press("Enter");
    const modal = page.getByRole("dialog", { name: "Book a test drive" });
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: /Aldo Sera/ })).toBeFocused();
  });

  test("closing the confirm sheet returns focus to the slot that opened it", async ({ page }) => {
    await page.goto(await carPath(page, /Kestrel Lane/));
    const slot = page.getByRole("button", { name: FREE_SLOT }).first();
    const label = (await slot.textContent())!;
    await slot.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Confirm your test drive" });
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: label })).toBeFocused();
  });

  test("closing the filter sheet returns focus to the Filters button", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /^Filters/ });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
});

test.describe("2.1.1 and 2.1.2 keyboard", () => {
  test("the slot calendar moves with arrow keys and picks a day with Enter", async ({ page }) => {
    await page.goto(await carPath(page, /Kestrel Lane/));
    const selected = page.getByRole("grid").getByRole("button", { name: /selected/ });
    await selected.focus();
    const before = page.url();
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press("ArrowRight");
      const focused = await page.evaluate(() => (document.activeElement as HTMLButtonElement | null)?.disabled === false);
      if (focused) break;
    }
    await page.keyboard.press("Enter");
    await expect.poll(() => page.url()).not.toBe(before);
    await expect(page).toHaveURL(/date=\d{4}-\d\d-\d\d/);
  });

  test("filter pills toggle with the keyboard and Tab leaves an open combobox", async ({ page }) => {
    await page.goto("/");
    const electric = page.getByRole("button", { name: "Electric" });
    await electric.focus();
    await page.keyboard.press("Space");
    await expect(page).toHaveURL(/powertrain=electric/);

    const brand = page.getByRole("combobox", { name: "Brand" });
    await brand.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("listbox")).toBeHidden();
    // Base UI hides the rest of the page from assistive tech only while the list is open.
    await expect(page.locator("header")).not.toHaveAttribute("aria-hidden", "true");
  });
});

test("2.4.7 and 1.4.11 the focus indicator is visible with 3:1 contrast, in both themes", async ({ page }) => {
  const car = await carPath(page, /Kestrel Lane/);
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const path of ["/", "/admin", "/connect", car]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        // Buttons transition their ring in; measure the end state.
        await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));
        const result = await page.evaluate(measureFocusIndicator);
        expect(result.ratio, `${scheme} ${path}: ${result.element}`).toBeGreaterThanOrEqual(3);
      }
    }
  }
});

/** Runs in the page: finds the focus ring or outline of the active element and its contrast with the surface behind it. */
function measureFocusIndicator() {
  // Computed colors come back as rgb(), lab(), or oklab(); a canvas pixel normalizes them to sRGB.
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  const parse = (value: string) => {
    const color = value.trim().match(/^(.*?)\s+-?[\d.]+px/)?.[1] ?? value.trim();
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = "rgba(0, 0, 0, 0)";
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  };
  const lum = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const c = (v: number) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
  };
  const ratioFor = (element: HTMLElement) => {
    let surface = element.parentElement;
    let bg = parse(getComputedStyle(document.body).backgroundColor);
    while (surface) {
      const color = parse(getComputedStyle(surface).backgroundColor);
      if (color.a > 0.9) {
        bg = color;
        break;
      }
      surface = surface.parentElement;
    }
    const style = getComputedStyle(element);
    const candidates: string[] = [];
    if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) candidates.push(style.outlineColor);
    for (const shadow of style.boxShadow.split(/,(?![^(]*\))/)) {
      const spread = shadow.trim().match(/(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/);
      if (spread && +spread[4] > 0) candidates.push(shadow);
    }
    let best = 0;
    for (const candidate of candidates) {
      const color = parse(candidate);
      if (color.a === 0) continue;
      const mixed = { r: color.r * color.a + bg.r * (1 - color.a), g: color.g * color.a + bg.g * (1 - color.a), b: color.b * color.a + bg.b * (1 - color.a) };
      const [hi, lo] = [lum(mixed), lum(bg)].sort((x, y) => y - x);
      best = Math.max(best, (hi + 0.05) / (lo + 0.05));
    }
    return best;
  };
  const focused = document.activeElement as HTMLElement;
  // The Next.js dev tools button is not part of the app.
  if (focused.tagName === "NEXTJS-PORTAL" || focused === document.body) return { ratio: Infinity, element: focused.tagName };
  // Input groups draw the ring for their text input on the wrapper.
  const group = focused.closest<HTMLElement>('[data-slot="input-group"]');
  const best = Math.max(ratioFor(focused), group ? ratioFor(group) : 0);
  const label = `${focused.tagName.toLowerCase()} "${(focused.getAttribute("aria-label") ?? focused.textContent ?? "").trim().slice(0, 40)}"`;
  return { ratio: best, element: label };
}

test("2.4.11 the sticky header never covers the focused element when tabbing backwards", async ({ page }) => {
  // 320 px is the narrowest width, where the header wraps to its tallest.
  await page.setViewportSize({ width: 320, height: 600 });
  await page.goto("/connect");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.getByRole("link").last().focus();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Shift+Tab");
    const covered = await page.evaluate(() => {
      const element = document.activeElement!;
      if (element.closest("header")) return false;
      const header = document.querySelector("header")!.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      return rect.bottom <= header.bottom + 1;
    });
    expect(covered).toBe(false);
  }
});

test.describe("1.4.10 reflow at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("no route scrolls sideways", async ({ page }) => {
    const booking = await bookOne(page, /Kestrel Moor/, "Reflow Check");
    const car = await carPath(page, /Kestrel Lane/);
    for (const path of ["/", car, booking, "/admin?tab=cars", "/admin?tab=brands", "/admin?tab=slots", "/admin?tab=bookings", "/connect", "/no-such-page"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await page.goto("/");
    await page.getByRole("link", { name: /Aldo Sera/ }).click();
    await expect(page.getByRole("dialog", { name: "Book a test drive" })).toBeVisible();
    const modalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(modalOverflow).toBeLessThanOrEqual(0);
  });

  test("the live status shows a text label, not only a colored dot", async ({ page }) => {
    await page.route("**/api/events**", (route) => route.abort());
    await page.goto("/");
    const status = page.getByRole("status", { name: "Live updates" });
    await expect(status).toHaveAttribute("data-status", /connecting|reconnecting/);
    await expect(page.locator("header").getByText(/^(Connecting|Reconnecting) to live updates$/)).toBeVisible();
  });
});

test("1.4.12 text spacing overrides do not clip text", async ({ page }) => {
  const car = await carPath(page, /Kestrel Lane/);
  for (const path of ["/", car, "/admin", "/connect"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.addStyleTag({
      content: "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }",
    });
    const clipped = await page.evaluate(() => {
      const out: string[] = [];
      for (const element of document.querySelectorAll<HTMLElement>("body *")) {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || element.closest(".sr-only, [aria-hidden=true]")) continue;
        if (style.overflow === "visible" && style.overflowX === "visible" && style.overflowY === "visible") continue;
        if (style.textOverflow === "ellipsis" || style.webkitLineClamp !== "none") continue;
        const ownText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim());
        if (!ownText) continue;
        if (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1) {
          out.push(`${element.tagName.toLowerCase()}.${element.className.toString().slice(0, 60)} "${element.textContent!.trim().slice(0, 30)}"`);
        }
      }
      return out;
    });
    expect(clipped, path).toEqual([]);
  }
});

test("4.1.3 the result count is a polite status that updates after filtering", async ({ page }) => {
  await page.goto("/");
  const count = page.getByRole("status").filter({ hasText: /\d+ cars?/ });
  await expect(count).toHaveText(/^\d+ cars$/);
  await page.getByRole("button", { name: "Electric" }).click();
  await expect(count).toHaveText("3 cars");
});

/** Starts a view transition and returns the durations of its pseudo-element animations. */
function viewTransitionDurations() {
  return new Promise<number[]>((resolve) => {
    const transition = document.startViewTransition(() => {});
    transition.ready.then(() => {
      const durations = document
        .getAnimations()
        .filter((animation) => (animation.effect as KeyframeEffect | null)?.pseudoElement?.startsWith("::view-transition"))
        .map((animation) => Number(animation.effect!.getComputedTiming().duration));
      resolve(durations);
    });
  });
}

test("prefers-reduced-motion turns view transition animations off", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const normal = await page.evaluate(viewTransitionDurations);
  expect(normal.some((duration) => duration > 0)).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  const reduced = await page.evaluate(viewTransitionDurations);
  expect(reduced.length).toBeGreaterThan(0);
  expect(reduced.every((duration) => duration === 0)).toBe(true);
});
