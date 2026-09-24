import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDay } from "@/lib/format";
import { parseLocalDay } from "@/lib/booking-service";

export type SlotOverviewRow = {
  carId: string;
  car: string;
  days: number;
  total: number;
  available: number;
  nextDay: string | null;
};

export function SlotOverview({ rows }: { rows: SlotOverviewRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Car</TableHead>
          <TableHead>Days scheduled</TableHead>
          <TableHead>Slots</TableHead>
          <TableHead>Available</TableHead>
          <TableHead>Next day</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.carId}>
            <TableCell className="font-medium">{row.car}</TableCell>
            <TableCell>{row.days}</TableCell>
            <TableCell>{row.total}</TableCell>
            <TableCell>{row.available}</TableCell>
            <TableCell>{row.nextDay ? formatDay(parseLocalDay(row.nextDay)) : <span className="text-muted-foreground">None</span>}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
