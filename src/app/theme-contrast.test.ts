import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(import.meta.dirname, "globals.css"), "utf8");

/** Reads the custom properties of the first block that starts with the selector. */
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

/** Relative luminance of a neutral `oklch(L 0 0)` token. For a gray, linear sRGB is L cubed. */
function grayLuminance(value: string): number {
  const match = value.match(/^oklch\(([\d.]+) 0 0\)$/);
  if (!match) throw new Error(`Expected an opaque neutral oklch token, got ${value}`);
  return Number(match[1]) ** 3;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [grayLuminance(a), grayLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes = { light: tokens(":root"), dark: tokens(".dark") };

describe.each(Object.entries(themes))("%s theme tokens", (_, t) => {
  it.each(["background", "card", "popover", "muted"])("the focus ring has 3:1 against --%s (WCAG 1.4.11)", (surface) => {
    expect(contrast(t.ring, t[surface])).toBeGreaterThanOrEqual(3);
  });

  it.each(["background", "card", "popover"])("input borders and switch tracks have 3:1 against --%s", (surface) => {
    expect(contrast(t.input, t[surface])).toBeGreaterThanOrEqual(3);
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(tsx|css)$/.test(name) ? [full] : [];
  });
}

it("no component dims the focus ring with an opacity modifier", () => {
  const offenders = sourceFiles(path.join(import.meta.dirname, "..")).filter((file) => /(ring|outline)-ring\/\d+/.test(readFileSync(file, "utf8")));
  expect(offenders.map((file) => path.relative(process.cwd(), file))).toEqual([]);
});
