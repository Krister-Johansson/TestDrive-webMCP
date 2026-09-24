import { reseed } from "./seed";
import { expect, test, type APIRequestContext } from "@playwright/test";

test.beforeAll(() => {
  reseed();
});

const HEADERS = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
  "mcp-protocol-version": "2025-06-18",
};

async function rpc(request: APIRequestContext, body: Record<string, unknown>) {
  const response = await request.post("/api/mcp", { headers: HEADERS, data: body });
  expect(response.ok(), await response.text()).toBeTruthy();
  const raw = await response.text();
  const contentType = response.headers()["content-type"] ?? "";
  if (contentType.includes("text/event-stream")) {
    const data = raw
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .find((line) => line.startsWith("{"));
    return JSON.parse(data ?? "{}");
  }
  return JSON.parse(raw);
}

test("the classic MCP endpoint initializes and lists the tools", async ({ request }) => {
  const init = await rpc(request, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "playwright", version: "1.0.0" },
    },
  });
  expect(init.result.serverInfo.name).toBe("testdrive");

  const tools = await rpc(request, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const names = tools.result.tools.map((tool: { name: string }) => tool.name);
  expect(names).toEqual(
    expect.arrayContaining(["find_cars", "list_available_slots", "book_test_drive", "cancel_booking"]),
  );

  const cars = await rpc(request, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "find_cars", arguments: { powertrain: "electric" } },
  });
  expect(cars.result.content[0].text).toContain("3 cars");
});
