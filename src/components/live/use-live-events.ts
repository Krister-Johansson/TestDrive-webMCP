"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { EVENT_TYPES } from "@/lib/events";
import { parseLiveEvent, type LiveEvent } from "@/lib/live-events";

export type EventSourceLike = {
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
  removeEventListener(type: string, listener: (event: MessageEvent) => void): void;
  close(): void;
  onopen: (() => void) | null;
  onerror: (() => void) | null;
};

export type LiveStatus = "connecting" | "open" | "reconnecting";

export type UseLiveEventsOptions = {
  onEvent: (event: LiveEvent) => void;
  url?: string;
  createEventSource?: (url: string) => EventSourceLike;
  enabled?: boolean;
};

/** Wires one EventSource and returns the function that tears it down. */
function connect(source: EventSourceLike, onEvent: (event: LiveEvent) => void, setStatus: (status: LiveStatus) => void) {
  const listener = (message: MessageEvent) => {
    const parsed = parseLiveEvent(String(message.data));
    if (parsed) onEvent(parsed);
  };
  source.onopen = () => setStatus("open");
  source.onerror = () => setStatus("reconnecting");
  for (const type of EVENT_TYPES) source.addEventListener(type, listener);
  return () => {
    for (const type of EVENT_TYPES) source.removeEventListener(type, listener);
    source.onopen = null;
    source.onerror = null;
    source.close();
  };
}

export function useLiveEvents(options: UseLiveEventsOptions) {
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const url = options.url ?? "/api/events";
  const enabled = options.enabled ?? true;
  const handleEvent = useEffectEvent((event: LiveEvent) => options.onEvent(event));
  const create = useEffectEvent(
    (target: string): EventSourceLike =>
      options.createEventSource?.(target) ?? (new EventSource(target) as unknown as EventSourceLike),
  );

  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = connect(create(url), handleEvent, setStatus);
    return unsubscribe;
  }, [url, enabled]);

  return { status };
}
