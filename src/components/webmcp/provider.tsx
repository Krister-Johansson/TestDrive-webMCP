"use client";

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

export type WebMcpSupport = "unknown" | "native" | "unavailable";

export type WebMcpState = {
  support: WebMcpSupport;
  /** True when tools should be registered: the browser has WebMCP. */
  active: boolean;
  registeredTools: string[];
};

export type WebMcpActions = {
  track: (name: string) => void;
  untrack: (name: string) => void;
};

type WebMcpContextValue = { state: WebMcpState; actions: WebMcpActions };

const WebMcpContext = createContext<WebMcpContextValue | null>(null);

function detectModelContext(): WebMcpSupport {
  if (typeof document === "undefined") return "unknown";
  return document.modelContext ? "native" : "unavailable";
}

const subscribeNever = () => () => {};

/** Tools register whenever the browser exposes WebMCP; there is no switch to turn them off. */
export function WebMcpProvider({ children }: { children: ReactNode }) {
  const support = useSyncExternalStore(subscribeNever, detectModelContext, () => "unknown" as const);
  const [registeredTools, setRegisteredTools] = useState<string[]>([]);

  const track = useCallback((name: string) => {
    setRegisteredTools((current) => (current.includes(name) ? current : [...current, name].sort()));
  }, []);
  const untrack = useCallback((name: string) => {
    setRegisteredTools((current) => current.filter((item) => item !== name));
  }, []);

  const value = useMemo<WebMcpContextValue>(
    () => ({
      state: { support, active: support === "native", registeredTools },
      actions: { track, untrack },
    }),
    [support, registeredTools, track, untrack],
  );

  return <WebMcpContext value={value}>{children}</WebMcpContext>;
}

export function useWebMcp(): WebMcpContextValue {
  const context = use(WebMcpContext);
  if (!context) throw new Error("useWebMcp must be used inside WebMcpProvider");
  return context;
}
