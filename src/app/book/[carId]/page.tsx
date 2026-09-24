import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CarBookingPage } from "@/components/booking/car-booking-view";
import { getCarForRequest, loadBookingView } from "@/lib/booking-view";
import { carName } from "@/lib/format";
import { getBookingService } from "@/lib/service";

type Props = {
  params: Promise<{ carId: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { carId } = await params;
  const car = getCarForRequest(carId);
  return { title: car ? `Book ${carName(car)}` : "Car not found" };
}

/** The full car page, used when the URL is opened directly or in a new tab. */
export default async function BookPage({ params, searchParams }: Props) {
  const [{ carId }, { date }] = await Promise.all([params, searchParams]);
  const view = loadBookingView(getBookingService(), carId, date);
  if (!view) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> All cars
      </Link>
      <CarBookingPage view={view} />
    </main>
  );
}
