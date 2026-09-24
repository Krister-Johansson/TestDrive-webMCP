import type { DomainEvent, EventBus } from "./events";

export function formatSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export type EventStreamOptions = {
  signal: AbortSignal;
  enrich?: (event: DomainEvent) => unknown;
  heartbeatMs?: number;
};

export function createEventStreamResponse(bus: EventBus, options: EventStreamOptions): Response {
  const encoder = new TextEncoder();
  const enrich = options.enrich ?? ((event: DomainEvent) => event);
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(formatSse(event, data)));
        } catch {
          cleanup?.();
        }
      };
      send("connected", { at: Date.now() });
      const unsubscribe = bus.subscribe((event) => {
        let data: unknown = event;
        try {
          data = enrich(event);
        } catch (error) {
          console.error(`Could not enrich ${event.type}`, error);
        }
        send(event.type, data);
      });
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          cleanup?.();
        }
      }, options.heartbeatMs ?? 15_000);
      cleanup = () => {
        cleanup = undefined;
        unsubscribe();
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      if (options.signal.aborted) {
        cleanup();
      } else {
        options.signal.addEventListener("abort", () => cleanup?.(), { once: true });
      }
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
