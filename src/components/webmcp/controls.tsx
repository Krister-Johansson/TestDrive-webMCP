"use client";

import { useState } from "react";
import { Check, CircleHelp, Copy, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { TOOL_DEFS, type ToolName } from "@/lib/tool-defs";
import { WEBMCP_FLAG_URL, WEBMCP_LINKS } from "@/lib/webmcp-links";
import { useWebMcp } from "./provider";


export function WebMcpControls() {
  const { support, enabled, active, setEnabled, registeredTools } = useWebMcp();
  const unavailable = support === "unavailable";

  return (
    <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1">
      <Switch
        id="webmcp-toggle"
        checked={enabled}
        disabled={unavailable}
        onCheckedChange={(checked) => setEnabled(checked)}
        aria-label="WebMCP"
      />
      <Label htmlFor="webmcp-toggle" className="cursor-pointer text-sm font-medium">
        WebMCP
      </Label>
      <SupportBadge />
      {active ? (
        <Popover>
          <PopoverTrigger render={<Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" />}>
            <Wrench aria-hidden="true" className="size-3" />
            {registeredTools.length} {registeredTools.length === 1 ? "tool" : "tools"}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <p className="mb-2 text-sm font-medium">Tools registered on this page</p>
            {registeredTools.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing registered yet.</p>
            ) : (
              <ul className="space-y-2">
                {registeredTools.map((name) => (
                  <li key={name} className="text-sm">
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">{name}</code>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {TOOL_DEFS[name as ToolName]?.description}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      ) : null}
      <HelpDialog />
    </div>
  );
}

function SupportBadge() {
  const { support } = useWebMcp();
  if (support === "unknown") return <Badge variant="outline">Checking…</Badge>;
  if (support === "native") return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Native</Badge>;
  return <Badge variant="secondary">Unavailable</Badge>;
}

export function HelpDialog() {
  const { support } = useWebMcp();
  const [copied, setCopied] = useState(false);

  async function copyFlag() {
    try {
      await navigator.clipboard.writeText(WEBMCP_FLAG_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="How to enable WebMCP" />}>
        <CircleHelp aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enable WebMCP in Chrome</DialogTitle>
          <DialogDescription>
            {support === "native"
              ? "This browser exposes document.modelContext, so the page can register tools for agents."
              : "This browser does not expose document.modelContext. WebMCP is still behind a flag."}
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          <li>
            Use Chrome 149 or newer. Chrome 153 or newer also lets the page unregister tools cleanly, which the toggle relies on.
          </li>
          <li>
            Open this address in a new tab. Pages cannot open chrome:// links, so copy it:
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-2 py-1 text-xs">{WEBMCP_FLAG_URL}</code>
              <Button size="sm" variant="outline" onClick={copyFlag}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </li>
          <li>Set the flag to Enabled and relaunch Chrome.</li>
          <li>Reload this page. The badge in the header turns to Native and the toggle becomes active.</li>
        </ol>
        <div className="space-y-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <p>
            To see and call the registered tools by hand, install the{" "}
            <a className="underline" href={WEBMCP_LINKS.inspector} target="_blank" rel="noreferrer">
              Model Context Tool Inspector
            </a>{" "}
            extension.
          </p>
          <p>
            The page can only detect whether the API exists, not whether it came from the flag. To know when the flag is
            no longer needed, watch the{" "}
            <a className="underline" href={WEBMCP_LINKS.chromeStatus} target="_blank" rel="noreferrer">
              Chrome Status entry
            </a>
            : once it reads as shipped, the API is on by default. Production sites can use the{" "}
            <a className="underline" href={WEBMCP_LINKS.originTrial} target="_blank" rel="noreferrer">
              origin trial
            </a>{" "}
            until then.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
