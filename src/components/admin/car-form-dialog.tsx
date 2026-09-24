"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BrandModelPicker, type BrandModelValue } from "@/components/booking/brand-model-picker";
import type { Car } from "@/db/schema";
import type { BrandTree } from "@/lib/booking-service";
import type { ActionResult } from "@/lib/actions";
import type { NewCar } from "@/lib/booking-service";
import {
  BODY_TYPES,
  CAR_COLORS,
  COLOR_NAMES,
  DRIVETRAINS,
  ENUM_LABELS,
  POWERTRAINS,
  TRANSMISSIONS,
  type BodyType,
  type CarColor,
  type Drivetrain,
  type Powertrain,
  type Transmission,
} from "@/lib/car-enums";

export type CarFormValues = NewCar;

export type CarFormDialogProps = {
  car: Car | null;
  brands: BrandTree[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CarFormValues) => Promise<ActionResult<Car>>;
};

type Draft = {
  brandModel: BrandModelValue | null;
  year: string;
  bodyType: BodyType;
  powertrain: Powertrain;
  transmission: Transmission;
  drivetrain: Drivetrain;
  color: CarColor;
  seats: string;
  towHitch: boolean;
  features: string;
  tagline: string;
  images: string;
};

function toDraft(car: Car | null): Draft {
  return {
    brandModel: car ? { brand: car.brand, model: car.model } : null,
    year: String(car?.year ?? new Date().getFullYear()),
    bodyType: car?.bodyType ?? "suv",
    powertrain: car?.powertrain ?? "electric",
    transmission: car?.transmission ?? "automatic",
    drivetrain: car?.drivetrain ?? "awd",
    color: car?.color ?? "White",
    seats: String(car?.seats ?? 5),
    towHitch: car?.towHitch ?? false,
    features: car?.features.join(", ") ?? "",
    tagline: car?.tagline ?? "",
    images: car?.images.map((image) => image.url).join("\n") ?? "",
  };
}

function parseFeatures(input: string): string[] {
  return input
    .split(",")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

export function CarFormDialog(props: CarFormDialogProps) {
  // Remount the form whenever the dialog opens or the car changes so every open starts clean.
  return <CarForm key={`${props.open}-${props.car?.id ?? "new"}`} {...props} />;
}

function CarForm({ car, brands, open, onOpenChange, onSubmit }: CarFormDialogProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(car));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!draft.brandModel) nextErrors.brandModel = "Pick a brand and model. Add new ones on the Brands tab.";
    const year = Number(draft.year);
    if (!Number.isInteger(year)) nextErrors.year = "Year must be a whole number.";
    const seats = Number(draft.seats);
    if (!Number.isInteger(seats) || seats < 1) nextErrors.seats = "Seats must be at least 1.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const brandModel = draft.brandModel;
    if (!brandModel) return;
    setServerError(null);
    startTransition(async () => {
      const result = await onSubmit({
        brand: brandModel.brand,
        model: brandModel.model,
        year,
        bodyType: draft.bodyType,
        powertrain: draft.powertrain,
        transmission: draft.transmission,
        drivetrain: draft.drivetrain,
        color: draft.color,
        seats,
        towHitch: draft.towHitch,
        features: parseFeatures(draft.features),
        tagline: draft.tagline.trim(),
        images: draft.images
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((url) => ({ url })),
      });
      if (result.ok) {
        onOpenChange(false);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{car ? "Edit car" : "Add a car"}</DialogTitle>
            <DialogDescription>
              {car ? "Changes show up everywhere as soon as you save." : "New cars are bookable once they have slots."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" data-invalid={errors.brandModel ? true : undefined}>
              <FieldLabel htmlFor="car-brandModel">Brand and model</FieldLabel>
              <BrandModelPicker id="car-brandModel" brands={brands} value={draft.brandModel} onChange={(v) => update("brandModel", v)} />
              {errors.brandModel ? <FieldError>{errors.brandModel}</FieldError> : null}
            </Field>
            <TextField id="year" label="Year" type="number" value={draft.year} error={errors.year} onChange={(v) => update("year", v)} />
            <TextField id="seats" label="Seats" type="number" value={draft.seats} error={errors.seats} onChange={(v) => update("seats", v)} />
            <EnumField id="bodyType" label="Body type" value={draft.bodyType} options={BODY_TYPES} labels={ENUM_LABELS.bodyType} onChange={(v) => update("bodyType", v)} />
            <EnumField id="powertrain" label="Powertrain" value={draft.powertrain} options={POWERTRAINS} labels={ENUM_LABELS.powertrain} onChange={(v) => update("powertrain", v)} />
            <EnumField id="transmission" label="Transmission" value={draft.transmission} options={TRANSMISSIONS} labels={ENUM_LABELS.transmission} onChange={(v) => update("transmission", v)} />
            <EnumField id="drivetrain" label="Drivetrain" value={draft.drivetrain} options={DRIVETRAINS} labels={ENUM_LABELS.drivetrain} onChange={(v) => update("drivetrain", v)} />
            <ColorField value={draft.color} onChange={(v) => update("color", v)} />
            <div className="sm:col-span-2">
              <TextField id="features" label="Features" value={draft.features} onChange={(v) => update("features", v)} placeholder="Comma separated, e.g. heated seats, panoramic roof" />
            </div>
            <div className="sm:col-span-2">
              <TextField id="tagline" label="Tagline" value={draft.tagline} onChange={(v) => update("tagline", v)} placeholder="One short sentence for the card" />
            </div>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="car-images">Photo URLs</FieldLabel>
              <Textarea
                id="car-images"
                value={draft.images}
                onChange={(e) => update("images", e.target.value)}
                placeholder="One https URL per line, in display order"
                rows={3}
              />
            </Field>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch id="car-towHitch" checked={draft.towHitch} onCheckedChange={(checked) => update("towHitch", checked)} />
              <Label htmlFor="car-towHitch">Tow hitch</Label>
            </div>
          </div>
          {serverError ? (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save car"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "number";
  placeholder?: string;
}) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={`car-${id}`}>{label}</FieldLabel>
      <Input
        id={`car-${id}`}
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

function ColorField({ value, onChange }: { value: CarColor; onChange: (value: CarColor) => void }) {
  const items = CAR_COLORS.map((color) => ({ value: color.name, label: color.name }));
  return (
    <Field>
      <FieldLabel htmlFor="car-color">Color</FieldLabel>
      <Select
        items={items}
        value={value}
        onValueChange={(next) => next && COLOR_NAMES.includes(next as CarColor) && onChange(next as CarColor)}
      >
        <SelectTrigger id="car-color" aria-label="Color" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CAR_COLORS.map((color) => (
            <SelectItem key={color.name} value={color.name}>
              <span className="mr-1.5 inline-block size-2.5 rounded-full ring-1 ring-foreground/20" style={{ background: color.hex }} />
              {color.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function EnumField<T extends string>({
  id,
  label,
  value,
  options,
  labels,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  const items = options.map((option) => ({ value: option, label: labels[option] }));
  return (
    <Field>
      <FieldLabel htmlFor={`car-${id}`}>{label}</FieldLabel>
      <Select items={items} value={value} onValueChange={(next) => next && onChange(next as T)}>
        <SelectTrigger id={`car-${id}`} aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
