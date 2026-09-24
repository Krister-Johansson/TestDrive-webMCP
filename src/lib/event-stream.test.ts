import { describe, expect, it } from "vitest";
import { createEventBus, type DomainEvent } from "./events";
import { createEventStreamResponse, formatSse } from "./event-stream";

async function readChunk(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const { value, done } = await reader.read();
  if (done || !value) throw new Error("stream ended");
  return new TextDecoder().decode(value);
}

describe("formatSse", () => {
  it("formats an event with a JSON data line", () => {
    expect(formatSse("booking.created", { a: 1 })).toBe('event: booking.created\ndata: {"a":1}\n\n');
  });
});

describe("createEventStreamResponse", () => {
  it("streams domain events as server-sent events and unsubscribes on abort", async () => {
    const bus = createEventBus();
    let subscribers = 0;
    const countingBus = {
      emit: bus.emit,
      subscribe(listener: (event: DomainEvent) => void) {
        subscribers += 1;
        const off = bus.subscribe(listener);
        return () => {
          subscribers -= 1;
          off();
        };
      },
    };
    const controller = new AbortController();
    const response = createEventStreamResponse(countingBus, {
      signal: controller.signal,
      enrich: (event) => ({ ...event, label: `label for ${event.type}` }),
    });
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("cache-control")).toContain("no-cache");
    const reader = response.body!.getReader();

    const hello = await readChunk(reader);
    expect(hello).toContain("event: connected");
    expect(subscribers).toBe(1);

    bus.emit({ type: "booking.created", payload: { bookingId: "b", slotId: "s", carId: "c" } });
    const chunk = await readChunk(reader);
    expect(chunk).toContain("event: booking.created");
    const data = JSON.parse(chunk.split("data: ")[1]);
    expect(data).toMatchObject({ type: "booking.created", payload: { bookingId: "b" }, label: "label for booking.created" });

    controller.abort();
    const { done } = await reader.read();
    expect(done).toBe(true);
    expect(subscribers).toBe(0);
  });
});
