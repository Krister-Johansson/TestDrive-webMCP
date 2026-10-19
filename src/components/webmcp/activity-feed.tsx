"use client";

import { Bot, Check, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearActivity, useActivity, type ActivityStatus } from "./activity-store";

/**
 * A floating log of the WebMCP tool calls an agent made on this page, newest first.
 * It renders nothing until the first call, so a demo without an agent looks unchanged.
 */
export function ActivityFeed() {
  const entries = useActivity();
  if (entries.length === 0) return null;

  return (
    <section
      role="log"
      aria-label="Agent activity"
      aria-live="polite"
      style={{ viewTransitionName: "agent-activity" }}
      className="fixed bottom-4 left-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-background/95 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80"
    >
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <Bot aria-hidden="true" className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Agent activity</h2>
        <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Clear agent activity" onClick={clearActivity}>
          <X aria-hidden="true" />
        </Button>
      </header>
      <ol className="max-h-72 space-y-2 overflow-y-auto p-3">
        {entries.map((entry) => (
          <li key={entry.id} className="flex gap-2 text-sm animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
            <StatusIcon status={entry.status} />
            <div className="min-w-0 flex-1">
              <code className="rounded bg-muted px-1 py-0.5 text-xs font-medium">{entry.tool}</code>
              {entry.args ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.args}</p> : null}
              {entry.summary ? (
                <p className={entry.status === "error" ? "mt-0.5 text-xs text-destructive" : "mt-0.5 text-xs"}>{entry.summary}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StatusIcon({ status }: { status: ActivityStatus }) {
  if (status === "running") {
    return <LoaderCircle role="img" aria-label="Running" className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" />;
  }
  if (status === "error") return <X role="img" aria-label="Failed" className="mt-0.5 size-4 shrink-0 text-destructive" />;
  return <Check role="img" aria-label="Done" className="mt-0.5 size-4 shrink-0 text-emerald-600" />;
}
