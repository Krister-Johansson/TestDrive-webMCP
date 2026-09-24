import { Badge } from "@/components/ui/badge";
import type { Car } from "@/db/schema";
import { ENUM_LABELS } from "@/lib/car-enums";

export function SpecSheet({ car }: { car: Car }) {
  const rows: [string, React.ReactNode][] = [
    ["Year", car.year],
    ["Body type", ENUM_LABELS.bodyType[car.bodyType]],
    ["Powertrain", ENUM_LABELS.powertrain[car.powertrain]],
    ["Transmission", ENUM_LABELS.transmission[car.transmission]],
    ["Drivetrain", ENUM_LABELS.drivetrain[car.drivetrain]],
    ["Seats", car.seats],
    ["Tow hitch", car.towHitch ? "Yes" : "No"],
    [
      "Color",
      <span key="color" className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-full ring-1 ring-foreground/20" style={{ background: car.colorHex }} />
        {car.color}
      </span>,
    ],
  ];
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b py-1.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {car.features.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Features">
          {car.features.map((feature) => (
            <li key={feature}>
              <Badge variant="outline" className="font-normal">
                {feature}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
