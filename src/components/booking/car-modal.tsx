"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * A large centered modal over the car list. Closing it goes back in history, so the list
 * keeps its filters and scroll position. While open, the URL is the car's shareable address.
 */
export function CarModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent
        style={{ viewTransitionName: "car-modal" }}
        className="max-h-[92vh] w-[min(96vw,72rem)] overflow-y-auto p-6 sm:max-w-6xl sm:p-8 [scrollbar-width:thin]"
      >
        <DialogTitle className="sr-only">Book a test drive</DialogTitle>
        <DialogDescription className="sr-only">Pick a time and confirm your test drive.</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
