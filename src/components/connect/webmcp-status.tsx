"use client";

import { Badge } from "@/components/ui/badge";
import { HelpDialog } from "@/components/webmcp/controls";
import { WEBMCP_FLAG_URL, WEBMCP_LINKS } from "@/lib/webmcp-links";
import { useWebMcp } from "@/components/webmcp/provider";
import { CopyButton } from "./copy-button";

const DEVTOOLS_SNIPPET = `const tools = await document.modelContext.getTools();
console.log(tools.map((t) => t.name));
const find = tools.find((t) => t.name === "find_cars");
console.log(await document.modelContext.executeTool(find, JSON.stringify({ powertrain: "electric" })));`;

export function WebMcpStatus() {
  const {
    state: { support, enabled, active, registeredTools },
  } = useWebMcp();
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Browser</dt>
        <dd>
          {support === "native" ? (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Native</Badge>
          ) : support === "unavailable" ? (
            <Badge variant="secondary">Unavailable</Badge>
          ) : (
            <Badge variant="outline">Checking…</Badge>
          )}
        </dd>
        <dt className="text-muted-foreground">Toggle</dt>
        <dd>{enabled ? "On" : "Off"}</dd>
        <dt className="text-muted-foreground">Registered here</dt>
        <dd>{active ? `${registeredTools.length} tools` : "None while off"}</dd>
      </dl>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Flag:</span>
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{WEBMCP_FLAG_URL}</code>
        <HelpDialog />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Try it in DevTools</p>
          <CopyButton text={DEVTOOLS_SNIPPET} />
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
          <code>{DEVTOOLS_SNIPPET}</code>
        </pre>
        <p className="text-xs text-muted-foreground">
          Turn the toggle on, open the console on any page here, and paste. Chrome takes the arguments as a JSON string.
        </p>
      </div>
      <ul className="space-y-1 text-sm">
        <li>
          <a className="underline" href={WEBMCP_LINKS.inspector} target="_blank" rel="noreferrer">
            Model Context Tool Inspector
          </a>{" "}
          <span className="text-muted-foreground">lists and calls the tools from a Chrome extension.</span>
        </li>
        <li>
          <a className="underline" href={WEBMCP_LINKS.docs} target="_blank" rel="noreferrer">
            Chrome WebMCP docs
          </a>
          <span className="text-muted-foreground">, </span>
          <a className="underline" href={WEBMCP_LINKS.explainer} target="_blank" rel="noreferrer">
            explainer
          </a>
          <span className="text-muted-foreground">, and </span>
          <a className="underline" href={WEBMCP_LINKS.chromeStatus} target="_blank" rel="noreferrer">
            Chrome Status
          </a>
          <span className="text-muted-foreground"> for the shipping timeline.</span>
        </li>
      </ul>
    </div>
  );
}
