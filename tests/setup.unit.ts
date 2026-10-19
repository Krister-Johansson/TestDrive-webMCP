import { vi } from "vitest";

// Unit fixtures use fixed dates in early October 2026. Pin the clock just before them so
// "already started" checks stay valid no matter when the suite runs.
vi.setSystemTime(new Date(2026, 8, 30, 8, 0));
