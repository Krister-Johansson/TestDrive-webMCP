import { createEventStreamResponse } from "@/lib/event-stream";
import { getEventBus } from "@/lib/events";
import { enrichEvent } from "@/lib/live-events";
import { getBookingService } from "@/lib/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const service = getBookingService();
  return createEventStreamResponse(getEventBus(), {
    signal: request.signal,
    enrich: (event) => enrichEvent(service, event),
  });
}
