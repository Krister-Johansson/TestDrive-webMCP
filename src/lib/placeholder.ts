/**
 * A deterministic look for cars without photos: a background color derived from the
 * car id, a lighter accent for the gradient, and a text color that meets WCAG AA.
 */
export type PlaceholderPalette = { hue: number; background: string; accent: string; text: string };

function hash(input: string): number {
  // FNV-1a, enough to spread ids across the hue wheel.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function luminance(hex: string): number {
  const channel = (c: string) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(hex.slice(1, 3)) + 0.7152 * channel(hex.slice(3, 5)) + 0.0722 * channel(hex.slice(5, 7));
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

export function placeholderPalette(id: string): PlaceholderPalette {
  const h = hash(id);
  const hue = h % 360;
  const saturation = 38 + ((h >>> 9) % 20); // 38 to 57, muted rather than loud
  let lightness = 30 + ((h >>> 14) % 18); // 30 to 47
  const white = "#ffffff";
  const ink = "#111418";
  let background = hslToHex(hue, saturation, lightness);
  let text = contrastRatio(white, background) >= contrastRatio(ink, background) ? white : ink;
  // Yellow-green hues around mid lightness can miss AA for both; darken until white passes.
  while (contrastRatio(text, background) < 4.5 && lightness > 10) {
    lightness -= 3;
    background = hslToHex(hue, saturation, lightness);
    text = white;
  }
  const accent = hslToHex((hue + 18) % 360, saturation, Math.min(lightness + 14, 62));
  return { hue, background, accent, text };
}
