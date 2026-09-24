"use client";

import { useSyncExternalStore } from "react";
import { CopyButton } from "./copy-button";

const subscribe = () => () => {};

export function useOrigin(fallback = "http://localhost:3000") {
  return useSyncExternalStore(subscribe, () => window.location.origin, () => fallback);
}

export function McpSnippets() {
  const origin = useOrigin();
  const url = `${origin}/api/mcp`;
  const claudeCode = `claude mcp add --transport http testdrive ${url}`;
  const claudeDesktop = JSON.stringify(
    { mcpServers: { testdrive: { command: "npx", args: ["-y", "mcp-remote", url] } } },
    null,
    2,
  );
  return (
    <div className="space-y-5">
      <Snippet title="Endpoint" text={url} description="Streamable HTTP, no auth. Any MCP client that speaks HTTP can connect." />
      <Snippet title="Claude Code" text={claudeCode} description="Run in a terminal, then start claude and ask it to book a test drive." />
      <Snippet
        title="Claude Desktop"
        text={claudeDesktop}
        description="Add to claude_desktop_config.json (Settings, Developer, Edit config) and restart Claude Desktop. mcp-remote bridges the stdio client to this HTTP endpoint."
      />
    </div>
  );
}

function Snippet({ title, text, description }: { title: string; text: string; description: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <CopyButton text={text} />
      </div>
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
        <code>{text}</code>
      </pre>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
