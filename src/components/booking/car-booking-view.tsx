import { BookingPanel } from "@/components/booking/booking-panel";
import { CarPhotoDetail } from "@/components/booking/car-photos";
import { SlotCalendar } from "@/components/booking/slot-calendar";
import { SpecSheet } from "@/components/booking/spec-sheet";
import { BookToolset } from "@/components/webmcp/book-tools";
import { parseLocalDay } from "@/lib/booking-service";
import type { BookingView } from "@/lib/booking-view";
import { carName, formatDay, formatLongDate } from "@/lib/format";

/** Photos, name, tagline, and the spec sheet. */
function CarSummary({ view, heading: Heading }: { view: BookingView; heading: "h1" | "h2" }) {
  const { car } = view;
  return (
    <section className="min-w-0 space-y-5">
      <CarPhotoDetail car={car} />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{car.brand}</p>
        <Heading className="text-3xl font-semibold tracking-tight">{carName(car)}</Heading>
        <p className="mt-1 text-muted-foreground">{car.tagline}</p>
      </div>
      <SpecSheet car={car} />
    </section>
  );
}

/** The calendar and the day's slots, plus the page-scoped WebMCP tool. */
function SlotPicker({ view, query }: { view: BookingView; query: string }) {
  const { car, days, selected, slots } = view;
  return (
    <section className="min-w-0 space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Pick a time</h2>
        <p className="text-sm text-muted-foreground">45 minute test drives. Booked slots update live.</p>
      </div>
      {days.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No slots have been scheduled for this car yet.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
          <SlotCalendar carId={car.id} days={days} selected={selected} query={query} />
          <div className="min-w-0 space-y-3">
            <h3 className="text-sm font-medium">
              {formatDay(parseLocalDay(selected))}
              <span className="ml-1.5 font-normal text-muted-foreground">{formatLongDate(parseLocalDay(selected))}</span>
            </h3>
            <BookToolset car={car} slots={slots} />
            <BookingPanel car={car} slots={slots} />
          </div>
        </div>
      )}
    </section>
  );
}

/** The full /book/[carId] page: two columns with an h1. */
export function CarBookingPage({ view, query = "" }: { view: BookingView; query?: string }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      <CarSummary view={view} heading="h1" />
      <SlotPicker view={view} query={query} />
    </div>
  );
}

/** The same content inside the modal over the list: an h2, since the list keeps the h1. */
export function CarBookingModal({ view, query = "" }: { view: BookingView; query?: string }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      <CarSummary view={view} heading="h2" />
      <SlotPicker view={view} query={query} />
    </div>
  );
}
