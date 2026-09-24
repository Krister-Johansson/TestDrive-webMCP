"use client";

import {
  cancelBookingAction,
  createBookingAction,
  findCarsAction,
  getBookingAction,
  listAvailableSlotsAction,
} from "@/lib/actions";
import { GlobalTools } from "./global-tools";

const actions = {
  findCars: findCarsAction,
  listAvailableSlots: listAvailableSlotsAction,
  getBooking: getBookingAction,
  createBooking: createBookingAction,
  cancelBooking: cancelBookingAction,
};

export function GlobalToolsMount() {
  return <GlobalTools actions={actions} />;
}
