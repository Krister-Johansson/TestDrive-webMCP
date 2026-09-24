import "@testing-library/jest-dom/vitest";
import "vitest-browser-react";
import "@/app/globals.css";

// next/link and next/navigation read process.env at module load; give them a minimal process.
const g = globalThis as unknown as { process?: { env: Record<string, string | undefined> } };
if (!g.process) {
  g.process = { env: { NODE_ENV: "test" } };
}
