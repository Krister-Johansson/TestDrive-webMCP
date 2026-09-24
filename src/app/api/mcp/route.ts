import { createMcpHandler } from "@modelcontextprotocol/server";
import { createTestDriveServer } from "@/mcp/server";
import { getBookingService } from "@/lib/service";

export const dynamic = "force-dynamic";

declare global {
  var __testdriveMcpHandler: ReturnType<typeof createMcpHandler> | undefined;
}

function handler() {
  if (!globalThis.__testdriveMcpHandler) {
    globalThis.__testdriveMcpHandler = createMcpHandler(() => createTestDriveServer(getBookingService()));
  }
  return globalThis.__testdriveMcpHandler;
}

export async function POST(request: Request): Promise<Response> {
  return handler().fetch(request);
}

export async function GET(request: Request): Promise<Response> {
  return handler().fetch(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return handler().fetch(request);
}
