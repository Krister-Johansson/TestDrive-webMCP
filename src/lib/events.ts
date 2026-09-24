export type DomainEventMap = {
  "car.created": { carId: string };
  "car.updated": { carId: string };
  "slots.generated": { carId: string; count: number };
  "slot.deleted": { carId: string; slotId: string };
  "booking.created": { bookingId: string; slotId: string; carId: string };
  "booking.cancelled": { bookingId: string; slotId: string; carId: string };
};

export type DomainEventType = keyof DomainEventMap;

export const EVENT_TYPES: readonly DomainEventType[] = [
  "car.created",
  "car.updated",
  "slots.generated",
  "slot.deleted",
  "booking.created",
  "booking.cancelled",
];

export type DomainEvent = {
  [K in DomainEventType]: { type: K; payload: DomainEventMap[K]; at: number };
}[DomainEventType];

export type DomainEventInput = {
  [K in DomainEventType]: { type: K; payload: DomainEventMap[K] };
}[DomainEventType];

export type EventListener = (event: DomainEvent) => void;

export interface EventBus {
  emit(event: DomainEventInput): void;
  subscribe(listener: EventListener): () => void;
}

export function createEventBus(): EventBus {
  const listeners = new Set<EventListener>();
  return {
    emit(event) {
      const stamped = { ...event, at: Date.now() } as DomainEvent;
      // A failing subscriber must not break the writer or the other subscribers.
      for (const listener of listeners) {
        try {
          listener(stamped);
        } catch (error) {
          console.error(`Event listener failed for ${stamped.type}`, error);
        }
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

declare global {
  var __testdriveEventBus: EventBus | undefined;
}

export function getEventBus(): EventBus {
  if (!globalThis.__testdriveEventBus) {
    globalThis.__testdriveEventBus = createEventBus();
  }
  return globalThis.__testdriveEventBus;
}
