"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

import { WEBMCP_STORAGE_KEY } from "@/lib/webmcp-links";

export type WebMcpSupport = "unknown" | "native" | "unavailable";

type WebMcpContextValue = {
  support: WebMcpSupport;
  enabled: boolean;
  /** True when tools should be registered: the user turned WebMCP on and the browser has it. */
  active: boolean;
  setEnabled: (enabled: boolean) => void;
  registeredTools: string[];
  track: (name: string) => void;
  untrack: (name: string) => void;
};

const WebMcpContext = createContext<WebMcpContextValue | null>(null);

function detectModelContext(): WebMcpSupport {
  if (typeof document === "undefined") return "unknown";
  return document.modelContext ? "native" : "unavailable";
}

// The toggle lives in localStorage so it survives reloads. A tiny external store keeps
// reads hydration-safe: the server snapshot is always "off".
const enabledListeners = new Set<() => void>();

function readEnabled(): boolean {
  try {
    return localStorage.getItem(WEBMCP_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeEnabled(next: boolean) {
  try {
    localStorage.setItem(WEBMCP_STORAGE_KEY, String(next));
  } catch {
    // storage can be unavailable in private windows
  }
  enabledListeners.forEach((listener) => listener());
}

function subscribeEnabled(listener: () => void) {
  enabledListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    enabledListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const subscribeNever = () => () => {};

export function WebMcpProvider({ children }: { children: ReactNode }) {
  const support = useSyncExternalStore(subscribeNever, detectModelContext, () => "unknown" as const);
  const enabled = useSyncExternalStore(subscribeEnabled, readEnabled, () => false);
  const [registeredTools, setRegisteredTools] = useState<string[]>([]);

  const setEnabled = useCallback((next: boolean) => writeEnabled(next), []);
  const track = useCallback((name: string) => {
    setRegisteredTools((current) => (current.includes(name) ? current : [...current, name].sort()));
  }, []);
  const untrack = useCallback((name: string) => {
    setRegisteredTools((current) => current.filter((item) => item !== name));
  }, []);

  const value = useMemo<WebMcpContextValue>(
    () => ({
      support,
      enabled,
      active: enabled && support === "native",
      setEnabled,
      registeredTools,
      track,
      untrack,
    }),
    [support, enabled, setEnabled, registeredTools, track, untrack],
  );

  return <WebMcpContext.Provider value={value}>{children}</WebMcpContext.Provider>;
}

export function useWebMcp(): WebMcpContextValue {
  const context = useContext(WebMcpContext);
  if (!context) throw new Error("useWebMcp must be used inside WebMcpProvider");
  return context;
}
