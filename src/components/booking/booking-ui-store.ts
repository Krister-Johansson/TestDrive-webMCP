import { useSyncExternalStore } from "react";

export type BookingUiState = {
  selectedSlotId: string | null;
  sheetOpen: boolean;
};

let state: BookingUiState = { selectedSlotId: null, sheetOpen: false };
const listeners = new Set<() => void>();

function setState(patch: Partial<BookingUiState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export function selectSlot(slotId: string | null, openSheet = true) {
  setState({ selectedSlotId: slotId, sheetOpen: slotId !== null && openSheet });
}

export function setSheetOpen(open: boolean) {
  setState({ sheetOpen: open, selectedSlotId: open ? state.selectedSlotId : null });
}

export function resetBookingUi() {
  setState({ selectedSlotId: null, sheetOpen: false });
}

export function getBookingUiState() {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverState: BookingUiState = { selectedSlotId: null, sheetOpen: false };

export function useBookingUi(): BookingUiState {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}
