import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Car } from "@/db/schema";
import { ENUM_LABELS } from "@/lib/car-enums";
import { carName } from "@/lib/format";
import { withQuery } from "@/lib/search-params";

export function CarTable({ cars, query = "" }: { cars: Car[]; query?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Body</TableHead>
            <TableHead>Powertrain</TableHead>
            <TableHead>Gearbox</TableHead>
            <TableHead>Drive</TableHead>
            <TableHead>Seats</TableHead>
            <TableHead>Tow hitch</TableHead>
            <TableHead>Color</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Book</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => (
            <TableRow key={car.id}>
              <TableCell>
                <Link href={withQuery(`/book/${car.id}`, query)} scroll={false} className="font-medium hover:underline">
                  {carName(car)}
                </Link>
                <div className="line-clamp-1 text-xs text-muted-foreground">{car.tagline}</div>
              </TableCell>
              <TableCell>{car.year}</TableCell>
              <TableCell>{ENUM_LABELS.bodyType[car.bodyType]}</TableCell>
              <TableCell>{ENUM_LABELS.powertrain[car.powertrain]}</TableCell>
              <TableCell>{ENUM_LABELS.transmission[car.transmission]}</TableCell>
              <TableCell>{car.drivetrain.toUpperCase()}</TableCell>
              <TableCell>{car.seats}</TableCell>
              <TableCell>{car.towHitch ? <Badge variant="outline">Yes</Badge> : <span className="text-muted-foreground">No</span>}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-full ring-1 ring-foreground/20" style={{ background: car.colorHex }} />
                  {car.color}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Link href={withQuery(`/book/${car.id}`, query)} scroll={false} className={buttonVariants({ size: "sm", variant: "outline" })}>
                  Book
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
