import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Car } from "@/db/schema";
import { ENUM_LABELS } from "@/lib/car-enums";
import { nextSortQuery, type CarSort, type CarSortKey } from "@/lib/car-sort";
import { carName } from "@/lib/format";
import { withQuery } from "@/lib/search-params";

const COLUMNS: { key: CarSortKey; label: string }[] = [
  { key: "car", label: "Car" },
  { key: "year", label: "Year" },
  { key: "body", label: "Body" },
  { key: "powertrain", label: "Powertrain" },
  { key: "gearbox", label: "Gearbox" },
  { key: "drive", label: "Drive" },
  { key: "seats", label: "Seats" },
  { key: "towHitch", label: "Tow hitch" },
  { key: "color", label: "Color" },
];

export function CarTable({
  cars,
  query = "",
  sort = null,
  currentQuery = "",
}: {
  cars: Car[];
  query?: string;
  sort?: CarSort | null;
  /** The browse page's query string, so sort links keep the active filters. */
  currentQuery?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <SortableHead key={column.key} column={column} sort={sort} currentQuery={currentQuery} />
            ))}
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

function SortableHead({ column, sort, currentQuery }: { column: { key: CarSortKey; label: string }; sort: CarSort | null; currentQuery: string }) {
  const active = sort?.key === column.key ? sort.order : null;
  const Icon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <TableHead scope="col" aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : undefined}>
      <Link
        href={`/?${nextSortQuery(new URLSearchParams(currentQuery), sort, column.key)}`}
        scroll={false}
        replace
        className="-mx-1.5 inline-flex h-8 items-center gap-1 rounded-md px-1.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
      >
        {column.label}
        <Icon aria-hidden="true" className={active ? "size-3.5" : "size-3.5 text-muted-foreground opacity-60"} />
      </Link>
    </TableHead>
  );
}
