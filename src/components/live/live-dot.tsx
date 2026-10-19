"use client";

import { cn } from "@/lib/utils";
import { useLiveStatus } from "./live-provider";

/**
 * One status region that stays mounted, so changes are announced (WCAG 4.1.3). While the
 * stream is healthy it is screen-reader-only; otherwise it shows a dot and a text label,
 * so the state never depends on color alone (WCAG 1.4.1).
 */
export function LiveDot() {
  const status = useLiveStatus();
  const healthy = status === "open";
  return (
    <span
      role="status"
      aria-label="Live updates"
      data-status={status}
      className={healthy ? "sr-only" : "flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground"}
    >
      {healthy ? (
        "Live updates on"
      ) : (
        <>
          <span
            aria-hidden="true"
            className={cn("inline-flex size-2 rounded-full", status === "connecting" ? "bg-amber-400" : "bg-red-500")}
          />
          <span>
            {status === "connecting" ? "Connecting" : "Reconnecting"}
            <span className="sr-only"> to live updates</span>
          </span>
        </>
      )}
    </span>
  );
}
