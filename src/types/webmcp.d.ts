// Minimal typing for Chrome's WebMCP surface. Only what this app touches.
interface ModelContextTool {
  name: string;
  description: string;
  inputSchema?: unknown;
  annotations?: Record<string, unknown>;
  execute: (args: unknown, options?: { signal?: AbortSignal }) => Promise<unknown> | unknown;
}

interface ModelContext {
  registerTool(tool: ModelContextTool, options?: { signal?: AbortSignal }): void | Promise<void>;
  getTools?(): ModelContextTool[] | Promise<ModelContextTool[]>;
  addEventListener?(type: "toolchange", listener: (event: Event) => void): void;
  removeEventListener?(type: "toolchange", listener: (event: Event) => void): void;
}

interface Document {
  modelContext?: ModelContext;
}
