import { test as setup } from "@playwright/test";
import { E2E_DB_FILE } from "./config";
import { reseed } from "./seed";

setup("seed the e2e database", async () => {
  const result = reseed();
  console.log(`Seeded ${result.cars} cars and ${result.slots} slots into ${E2E_DB_FILE}`);
});
