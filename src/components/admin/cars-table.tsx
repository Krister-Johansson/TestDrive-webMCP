"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Car } from "@/db/schema";
import type { BrandTree } from "@/lib/booking-service";
import { createCarAction, updateCarAction } from "@/lib/actions";
import { ENUM_LABELS } from "@/lib/car-enums";
import { CarFormDialog } from "./car-form-dialog";

export function CarsTable({ cars, brands }: { cars: Car[]; brands: BrandTree[] }) {
  const [editing, setEditing] = useState<Car | null>(null);
  const [open, setOpen] = useState(false);

  async function toggleActive(car: Car, active: boolean) {
    const result = await updateCarAction(car.id, { active });
    if (!result.ok) toast.error(result.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{cars.length} cars in the fleet. Inactive cars stay hidden from customers.</p>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus aria-hidden="true" /> Add car
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Body</TableHead>
            <TableHead>Powertrain</TableHead>
            <TableHead>Gearbox</TableHead>
            <TableHead>Seats</TableHead>
            <TableHead>Hitch</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => (
            <TableRow key={car.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full ring-1 ring-foreground/20" style={{ background: car.colorHex }} />
                  <span className="font-medium">
                    {car.brand} {car.model}
                  </span>
                </div>
              </TableCell>
              <TableCell>{car.year}</TableCell>
              <TableCell>{ENUM_LABELS.bodyType[car.bodyType]}</TableCell>
              <TableCell>{ENUM_LABELS.powertrain[car.powertrain]}</TableCell>
              <TableCell>{ENUM_LABELS.transmission[car.transmission]}</TableCell>
              <TableCell>{car.seats}</TableCell>
              <TableCell>{car.towHitch ? <Badge variant="outline">Yes</Badge> : <span className="text-muted-foreground">No</span>}</TableCell>
              <TableCell>
                <Switch
                  aria-label={`${car.brand} ${car.model} active`}
                  checked={car.active}
                  onCheckedChange={(checked) => toggleActive(car, checked)}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Edit ${car.brand} ${car.model}`}
                  onClick={() => {
                    setEditing(car);
                    setOpen(true);
                  }}
                >
                  <Pencil aria-hidden="true" /> Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <CarFormDialog
        car={editing}
        brands={brands}
        open={open}
        onOpenChange={setOpen}
        onSubmit={async (values) => {
          const result = editing ? await updateCarAction(editing.id, values) : await createCarAction(values);
          return result;
        }}
      />
    </div>
  );
}
