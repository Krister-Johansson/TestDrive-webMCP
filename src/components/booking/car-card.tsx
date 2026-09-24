import Link from "next/link";
import { ViewTransition } from "react";
import { Armchair, CalendarDays, Cog, Fuel, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Car } from "@/db/schema";
import { ENUM_LABELS } from "@/lib/car-enums";
import { carName } from "@/lib/format";
import { withQuery } from "@/lib/search-params";
import { CarPhotos } from "./car-photos";

export function CarCard({ car, query = "" }: { car: Car; query?: string }) {
  const href = withQuery(`/book/${car.id}`, query);
  return (
    <Card className="group/card h-full overflow-hidden py-0 transition-colors hover:border-foreground/30">
      <CardHeader className="relative p-0">
        <ViewTransition name={`car-${car.id}`} share="morph" default="none">
          <CarPhotos car={car} variant="card" href={href} />
        </ViewTransition>
        <span
          className="absolute top-3 left-3 size-3 rounded-full ring-2 ring-background"
          style={{ background: car.colorHex }}
          title={car.color}
        />
        <Badge variant="secondary" className="absolute top-3 right-3">
          {ENUM_LABELS.bodyType[car.bodyType]}
        </Badge>
      </CardHeader>
      <Link href={href} scroll={false} className="flex flex-1 flex-col outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <CardContent className="space-y-3 pt-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">{carName(car)}</h3>
            <p className="line-clamp-1 text-sm text-muted-foreground">{car.tagline}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            <Spec icon={CalendarDays} label="Year">{car.year}</Spec>
            <Spec icon={Fuel} label="Powertrain">{ENUM_LABELS.powertrain[car.powertrain]}</Spec>
            <Spec icon={Cog} label="Transmission">{ENUM_LABELS.transmission[car.transmission]}</Spec>
            <Spec icon={Armchair} label="Seats">{car.seats} seats</Spec>
            {car.towHitch ? (
              <Spec icon={Truck} label="Towing">Tow hitch</Spec>
            ) : (
              <Spec icon={Truck} label="Towing" muted>
                No tow hitch
              </Spec>
            )}
          </dl>
        </CardContent>
        <CardFooter className="mt-auto flex min-h-14 flex-wrap content-start gap-1.5 pb-5">
          {car.features.slice(0, 3).map((feature) => (
            <Badge key={feature} variant="outline" className="font-normal">
              {feature}
            </Badge>
          ))}
        </CardFooter>
      </Link>
    </Card>
  );
}

function Spec({
  icon: Icon,
  label,
  children,
  muted = false,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "flex items-center gap-1.5 text-muted-foreground/70" : "flex items-center gap-1.5 text-foreground/90"}>
      <dt className="sr-only">{label}</dt>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <dd>{children}</dd>
    </div>
  );
}
