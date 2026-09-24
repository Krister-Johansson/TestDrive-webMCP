import { notFound } from "next/navigation";
import { CarBookingView } from "@/components/booking/car-booking-view";
import { CarModal } from "@/components/booking/car-modal";
import { loadBookingView } from "@/lib/booking-view";
import { getBookingService } from "@/lib/service";

type Props = {
  params: Promise<{ carId: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
};

/**
 * Opened from the list: the same /book/[carId] URL, shown as a modal over the list.
 * A hard load of that URL renders the full page instead.
 */
export default async function BookModal({ params, searchParams }: Props) {
  const { carId } = await params;
  const { date } = await searchParams;
  const view = loadBookingView(getBookingService(), carId, date);
  if (!view) notFound();
  return (
    <CarModal>
      <CarBookingView view={view} heading="h2" morph={false} />
    </CarModal>
  );
}
