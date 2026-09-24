"use client";

import { useRouter } from "next/navigation";
import { createContext, startTransition, useContext, type ReactNode } from "react";
import { toast } from "sonner";
import type { LiveEvent } from "@/lib/live-events";
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
  const onEvent = (event: LiveEvent) => {
    startTransition(() => {
      router.refresh();
    });
    if (TOAST_EVENTS.has(event.type) && event.label) {
      toast(event.label, { description: "Live update", id: `${event.type}-${event.at}` });
    }
  };
  const { status } = useLiveEvents({ onEvent });
  return <LiveContext.Provider value={{ status }}>{children}</LiveContext.Provider>;
}

export function useLiveStatus(): LiveStatus {
  return useContext(LiveContext).status;
}
