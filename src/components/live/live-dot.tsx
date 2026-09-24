"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLiveStatus } from "./live-provider";

const LABELS = {
  connecting: "Connecting to live updates",
  open: "Live updates on",
  reconnecting: "Live updates reconnecting",
} as const;

/** Only visible while the live connection is not healthy; otherwise a screen-reader-only status. */
export function LiveDot() {
  const status = useLiveStatus();
  if (status === "open") {
    return (
      <span role="status" aria-label="Live updates" data-status={status} className="sr-only">
        {LABELS.open}
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="status"
            aria-label="Live updates"
            data-status={status}
            className="flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground"
          />
        }
      >
        <span className="relative flex size-2">
          <span
            className={cn(
              "relative inline-flex size-2 rounded-full",
              status === "connecting" && "bg-amber-400",
              status === "reconnecting" && "bg-red-500",
            )}
          />
        </span>
        <span className="hidden sm:inline">{status === "connecting" ? "Connecting" : "Reconnecting"}</span>
      </TooltipTrigger>
      <TooltipContent>{LABELS[status]}</TooltipContent>
    </Tooltip>
  );
}
