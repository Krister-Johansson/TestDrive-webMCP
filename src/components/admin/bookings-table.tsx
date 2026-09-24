"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ActionResult } from "@/lib/actions";
import type { BookingDetail } from "@/lib/booking-service";
import { carName, formatSlotTime } from "@/lib/format";

export type BookingsTableProps = {
  bookings: BookingDetail[];
  cancel: (bookingId: string) => Promise<ActionResult<BookingDetail>>;
};

export function BookingsTable({ bookings, cancel }: BookingsTableProps) {
  const [target, setTarget] = useState<BookingDetail | null>(null);
  const [pending, startTransition] = useTransition();

  if (bookings.length === 0) {
    return <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No bookings yet.</p>;
  }

  function confirmCancel() {
    if (!target) return;
    const id = target.id;
    startTransition(async () => {
      const result = await cancel(id);
      // The cancelled event on the live stream refreshes the page for every tab, this one included.
      if (!result.ok) toast.error(result.error);
      setTarget(null);
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Car</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <div className="font-medium">{booking.customerName}</div>
                <div className="text-xs text-muted-foreground">{booking.customerEmail ?? booking.note ?? booking.id}</div>
              </TableCell>
              <TableCell>{carName(booking.car)}</TableCell>
              <TableCell className="tabular-nums">{formatSlotTime(booking.slot.startsAt)}</TableCell>
              <TableCell>
                <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>{booking.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {booking.status === "confirmed" ? (
                  <Button variant="ghost" size="sm" onClick={() => setTarget(booking)}>
                    Cancel
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {target ? `${target.customerName}, ${carName(target.car)}, ${formatSlotTime(target.slot.startsAt)}. The slot opens up again.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={confirmCancel}>
              Cancel booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
