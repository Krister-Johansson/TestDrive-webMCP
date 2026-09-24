"use client";

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

export type WebMcpSupport = "unknown" | "native" | "unavailable";

export type WebMcpState = {
  support: WebMcpSupport;
  enabled: boolean;
  /** True when tools should be registered: the toggle is on and the browser has WebMCP. */
  active: boolean;
  registeredTools: string[];
};

export type WebMcpActions = {
  setEnabled: (enabled: boolean) => void;
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

/**
 * The WebMCP toggle is deliberately not persisted: every page load starts with tools off,
 * so a demo always begins from the same state. Client-side navigation keeps it.
 */
export function WebMcpProvider({ children, defaultEnabled = false }: { children: ReactNode; defaultEnabled?: boolean }) {
  const support = useSyncExternalStore(subscribeNever, detectModelContext, () => "unknown" as const);
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [registeredTools, setRegisteredTools] = useState<string[]>([]);

  const track = useCallback((name: string) => {
    setRegisteredTools((current) => (current.includes(name) ? current : [...current, name].sort()));
  }, []);
  const untrack = useCallback((name: string) => {
    setRegisteredTools((current) => current.filter((item) => item !== name));
  }, []);

  const value = useMemo<WebMcpContextValue>(
    () => ({
      state: { support, enabled, active: enabled && support === "native", registeredTools },
      actions: { setEnabled, track, untrack },
    }),
    [support, enabled, registeredTools, track, untrack],
  );

  return <WebMcpContext value={value}>{children}</WebMcpContext>;
}

export function useWebMcp(): WebMcpContextValue {
  const context = use(WebMcpContext);
  if (!context) throw new Error("useWebMcp must be used inside WebMcpProvider");
  return context;
}
