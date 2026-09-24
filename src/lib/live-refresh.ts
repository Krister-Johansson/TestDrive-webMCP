import type { LiveEvent } from "./live-events";

/**
 * Whether a live event can change what the current route renders. A booking on one car
 * should not re-render a tab that is looking at another car, and the Connect page shows
 * no data at all.
 */
export function shouldRefreshFor(pathname: string, event: LiveEvent): boolean {
  if (pathname.startsWith("/connect")) return false;
  const carPage = pathname.match(/^\/book\/([^/?]+)/);
  if (!carPage) return true;
  if (event.type === "car.created" || event.type === "car.updated") return true;
  return event.payload.carId === carPage[1];
}
