import { describe, expect, it } from "vitest";
import { createTestDb } from "./index";

describe("createDb", () => {
  it("enforces foreign keys after migrating", () => {
    const db = createTestDb();
    expect(db.$client.prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
    expect(() => db.$client.exec("INSERT INTO models (id, brand_id, name, created_at) VALUES ('m', 'missing', 'X', 0)")).toThrow();
  });
});
