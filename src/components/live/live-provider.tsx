"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, startTransition, use, type ReactNode } from "react";
import { toast } from "sonner";
import type { LiveEvent } from "@/lib/live-events";
import { shouldRefreshFor } from "@/lib/live-refresh";
import { useLiveEvents, type LiveStatus } from "./use-live-events";

type LiveContextValue = { status: LiveStatus };

const LiveContext = createContext<LiveContextValue>({ status: "connecting" });

const TOAST_EVENTS = new Set<LiveEvent["type"]>([
  "booking.created",
  "booking.cancelled",
  "slots.generated",
  "car.created",
]);

export function LiveProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const onEvent = (event: LiveEvent) => {
    if (shouldRefreshFor(pathname, event)) {
      startTransition(() => {
        router.refresh();
      });
    }
    if (TOAST_EVENTS.has(event.type) && event.label) {
      toast(event.label, { description: "Live update", id: `${event.type}-${event.at}` });
    }
  };
  const { status } = useLiveEvents({ onEvent });
  return <LiveContext value={{ status }}>{children}</LiveContext>;
}

export function useLiveStatus(): LiveStatus {
  return use(LiveContext).status;
}
