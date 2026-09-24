import Link from "next/link";
import { CarFront } from "lucide-react";
import { LiveDot } from "@/components/live/live-dot";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "./nav-links";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:h-14 md:py-0">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CarFront className="size-4" aria-hidden="true" />
          </span>
          TestDrive
        </Link>
        <NavLinks />
        <div className="ml-auto flex items-center gap-1">
          <LiveDot />
          <ThemeToggle />
        </div>
        <div className="order-last basis-full md:order-none md:-ml-3 md:basis-auto">{children}</div>
      </div>
    </header>
  );
}
