import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { useLiveEvents, type EventSourceLike } from "./use-live-events";
import type { LiveEvent } from "@/lib/live-events";

class FakeEventSource implements EventSourceLike {
  static instances: FakeEventSource[] = [];
  listeners = new Map<string, (event: MessageEvent) => void>();
  closed = false;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.listeners.set(type, listener);
  }
  removeEventListener(type: string) {
    this.listeners.delete(type);
  }
  close() {
    this.closed = true;
  }
  push(type: string, data: unknown) {
    this.listeners.get(type)?.(new MessageEvent(type, { data: JSON.stringify(data) }));
  }
}

function Probe({ onEvent }: { onEvent: (event: LiveEvent) => void }) {
  const { status } = useLiveEvents({
    onEvent,
    createEventSource: (url) => new FakeEventSource(url),
  });
  return <output>{status}</output>;
}

test("subscribes to the event stream, reports status, and closes on unmount", async () => {
  FakeEventSource.instances = [];
  const onEvent = vi.fn();
  const screen = await render(<Probe onEvent={onEvent} />);
  await expect.element(screen.getByRole("status")).toHaveTextContent("connecting");

  const source = FakeEventSource.instances[0];
  expect(source.url).toBe("/api/events");
  source.onopen?.();
  await expect.element(screen.getByRole("status")).toHaveTextContent("open");

  const event: LiveEvent = {
    type: "booking.created",
    payload: { bookingId: "b", slotId: "s", carId: "c" },
    at: 1,
    label: "Booked",
  };
  source.push("booking.created", event);
  expect(onEvent).toHaveBeenCalledWith(event);

  source.onerror?.();
  await expect.element(screen.getByRole("status")).toHaveTextContent("reconnecting");

  screen.unmount();
  expect(source.closed).toBe(true);
});
