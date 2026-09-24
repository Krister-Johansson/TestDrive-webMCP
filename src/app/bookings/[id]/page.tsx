import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, CircleSlash } from "lucide-react";
import { CancelBookingButton } from "@/components/booking/cancel-booking-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { carName, formatLongDate, formatTime } from "@/lib/format";
import { getBookingService } from "@/lib/service";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = getBookingService().getBooking(id);
  if (!booking) notFound();
  const confirmed = booking.status === "confirmed";

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <span
          className={
            confirmed
              ? "flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          }
        >
          {confirmed ? <CalendarCheck className="size-5" aria-hidden="true" /> : <CircleSlash className="size-5" aria-hidden="true" />}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {confirmed ? "Test drive confirmed" : "Booking cancelled"}
          </h1>
          <p className="text-sm text-muted-foreground">Booking id {booking.id}</p>
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{carName(booking.car)}</CardTitle>
          <Badge variant={confirmed ? "default" : "secondary"}>{booking.status}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Row label="When">
              {formatLongDate(booking.slot.startsAt)}, {formatTime(booking.slot.startsAt)} to {formatTime(booking.slot.endsAt)}
            </Row>
            <Row label="Name">{booking.customerName}</Row>
            <Row label="Email">{booking.customerEmail ?? "Not given"}</Row>
            <Row label="Note">{booking.note ?? "None"}</Row>
          </dl>
        </CardContent>
      </Card>
      <div className="mt-6 flex flex-wrap gap-2">
        {confirmed ? <CancelBookingButton bookingId={booking.id} /> : null}
        <Link href={`/book/${booking.car.id}`} className={buttonVariants({ variant: "ghost" })}>
          Back to {carName(booking.car)}
        </Link>
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          Book another
        </Link>
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
