import path from "node:path";

export const E2E_PORT = 3100;
export const E2E_DB_FILE = path.join(process.cwd(), ".e2e", "testdrive.db");
