import type { Metadata } from "next";
import { Bot, Globe, Plug } from "lucide-react";
import { McpSnippets } from "@/components/connect/mcp-snippets";
import { WebMcpStatus } from "@/components/connect/webmcp-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TOOL_DEFS } from "@/lib/tool-defs";

export const metadata: Metadata = { title: "Connect an agent" };

const PAGE_TOOLS = new Set(["filter_cars", "select_car", "select_slot", "list_bookings", "create_car", "generate_slots", "add_model"]);
const WEBMCP_ONLY = new Set(["filter_cars", "select_car", "select_slot"]);

export default function ConnectPage() {
  const tools = Object.values(TOOL_DEFS);
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Connect an agent</h1>
        <p className="max-w-3xl text-muted-foreground">
          The same booking flow, three ways in. An agent can click through the page like a person, use tools the page
          registers in the browser through WebMCP, or talk to the classic MCP server over HTTP from anywhere.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Bot className="size-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>No tools</CardTitle>
            <CardDescription>What a browser agent sees today: the page itself.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              With WebMCP off, an agent has to read the DOM, pick a car card, click a slot, fill the form, and press
              confirm. It works, but every step is guesswork and every layout change breaks it.
            </p>
            <p className="text-muted-foreground">Try it: turn WebMCP off in the header and ask an agent to book a test drive.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Globe className="size-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>WebMCP</CardTitle>
            <CardDescription>Tools registered by this page, in this tab, with your session.</CardDescription>
          </CardHeader>
          <CardContent>
            <WebMcpStatus />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Plug className="size-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Classic MCP</CardTitle>
            <CardDescription>A server any MCP client can install. Same tools, same data.</CardDescription>
          </CardHeader>
          <CardContent>
            <McpSnippets />
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">The tool set</h2>
          <p className="text-sm text-muted-foreground">
            One vocabulary for both routes. Page tools only exist in WebMCP because they act on the page you are looking at.
          </p>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {tools.map((tool) => (
            <li key={tool.name} className="rounded-lg border p-4">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <code className="text-sm font-semibold">{tool.name}</code>
                {tool.annotations.readOnlyHint ? <Badge variant="outline">read-only</Badge> : null}
                {"consequentialHint" in tool.annotations && tool.annotations.consequentialHint ? (
                  <Badge variant="secondary">consequential</Badge>
                ) : null}
                {WEBMCP_ONLY.has(tool.name) ? <Badge>WebMCP page tool</Badge> : PAGE_TOOLS.has(tool.name) ? <Badge variant="secondary">admin page in WebMCP</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
