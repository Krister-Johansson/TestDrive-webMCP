import { ViewTransition } from "react";
import { BookingPanel } from "@/components/booking/booking-panel";
import { CarPhotos } from "@/components/booking/car-photos";
import { SlotCalendar } from "@/components/booking/slot-calendar";
import { SpecSheet } from "@/components/booking/spec-sheet";
import { BookToolset } from "@/components/webmcp/book-tools";
import { parseLocalDay } from "@/lib/booking-service";
import type { BookingView } from "@/lib/booking-view";
import { carName, formatDay, formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The car detail plus slot picker. `compact` stacks it in one column; otherwise it spreads
 * over two columns. `morph` shares the silhouette's view transition with the list card, which
 * only makes sense on the full page: inside the modal the card is still mounted underneath.
 */
export function CarBookingView({
  view,
  heading: Heading = "h1",
  query = "",
  compact = false,
  morph = true,
}: {
  view: BookingView;
  heading?: "h1" | "h2";
  query?: string;
  compact?: boolean;
  morph?: boolean;
}) {
  const { car, days, selected, slots } = view;
  const photos = <CarPhotos car={car} />;
  return (
    <div className={cn("grid gap-8", !compact && "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10")}>
      <section className="min-w-0 space-y-5">
        {morph ? (
          <ViewTransition name={`car-${car.id}`} share="morph" default="none">
            {photos}
          </ViewTransition>
        ) : (
          photos
        )}
        <div>
          <p className="text-sm font-medium text-muted-foreground">{car.brand}</p>
          <Heading className={cn("font-semibold tracking-tight", compact ? "text-2xl" : "text-3xl")}>{carName(car)}</Heading>
          <p className="mt-1 text-muted-foreground">{car.tagline}</p>
        </div>
        <SpecSheet car={car} />
      </section>
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
          <div className={cn("grid gap-6", !compact && "md:grid-cols-[auto_minmax(0,1fr)]")}>
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
    </div>
  );
}
