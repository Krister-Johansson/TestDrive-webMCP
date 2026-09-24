"use client";

import { useId, useState } from "react";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  BODY_TYPES,
  CAR_COLORS,
  DRIVETRAINS,
  ENUM_LABELS,
  POWERTRAINS,
  TRANSMISSIONS,
} from "@/lib/car-enums";
import { CAR_FILTER_KEYS, countActiveFilters, hasActiveFilters, type CarFilters } from "@/lib/car-filters";
import type { FacetOptions } from "@/lib/booking-service";
import { cn } from "@/lib/utils";

const ANY = "__any__";
const SEAT_OPTIONS = [2, 4, 5, 7];

function filterChipLabel(key: keyof CarFilters, value: CarFilters[keyof CarFilters]): string {
  switch (key) {
    case "bodyType":
      return ENUM_LABELS.bodyType[value as keyof typeof ENUM_LABELS.bodyType];
    case "powertrain":
      return ENUM_LABELS.powertrain[value as keyof typeof ENUM_LABELS.powertrain];
    case "transmission":
      return ENUM_LABELS.transmission[value as keyof typeof ENUM_LABELS.transmission];
    case "drivetrain":
      return String(value).toUpperCase();
    case "model":
      return `Model ${value}`;
    case "minSeats":
      return `${value}+ seats`;
    case "towHitch":
      return value ? "Tow hitch" : "No tow hitch";
    case "yearFrom":
      return `From ${value}`;
    case "yearTo":
      return `To ${value}`;
    default:
      return String(value);
  }
}

/** Applies one change to the filter object, dropping the model when the brand changes. */
function applyChange<K extends keyof CarFilters>(filters: CarFilters, key: K, value: CarFilters[K] | undefined): CarFilters {
  const next: CarFilters = { ...filters };
  if (value === undefined || value === null || value === "") {
    delete next[key];
  } else {
    next[key] = value;
  }
  if (key === "brand" && next.brand !== filters.brand) delete next.model;
  return next;
}

export type FilterPanelProps = {
  filters: CarFilters;
  onChange: (filters: CarFilters) => void;
  /** Values still in stock for each control, given the other active filters. */
  options: FacetOptions;
};

/** The stacked filter controls. Lives in the sidebar on wide screens and in a sheet on phones. */
export function FilterPanel({ filters, onChange, options }: FilterPanelProps) {
  const id = useId();
  const [feature, setFeature] = useState(filters.feature ?? "");
  const [syncedFeature, setSyncedFeature] = useState(filters.feature);
  if (syncedFeature !== filters.feature) {
    setSyncedFeature(filters.feature);
    setFeature(filters.feature ?? "");
  }

  const set = <K extends keyof CarFilters>(key: K, value: CarFilters[K] | undefined) =>
    onChange(applyChange(filters, key, value));

  function commitFeature(value: string) {
    const trimmed = value.trim();
    if ((filters.feature ?? "") === trimmed) return;
    set("feature", trimmed || undefined);
  }

  const inStock = <T extends string>(facets: { value: string }[], all: readonly T[]) =>
    all.filter((value) => facets.some((facet) => facet.value === value));
  const brandNames = options.brand.map((facet) => facet.value);
  const modelNames = options.model.map((facet) => facet.value);
  const bodyTypes = inStock(options.bodyType, BODY_TYPES);
  const powertrains = inStock(options.powertrain, POWERTRAINS);
  const transmissions = inStock(options.transmission, TRANSMISSIONS);
  const drivetrains = inStock(options.drivetrain, DRIVETRAINS);
  const colors = CAR_COLORS.filter((color) => options.color.some((facet) => facet.value === color.name));
  const maxSeats = Math.max(0, ...options.seats);
  const seatOptions = SEAT_OPTIONS.filter((n) => n <= maxSeats);

  return (
    <div className="space-y-4">
      <Section title="Brand and model">
        <div className="space-y-2">
          <SearchField label="Brand" value={filters.brand ?? null} options={brandNames} placeholder="Any brand" onChange={(v) => set("brand", v ?? undefined)} />
          <SearchField
            label="Model"
            value={filters.model ?? null}
            options={modelNames}
            placeholder={filters.brand ? "Any model" : "Pick a brand first"}
            disabled={!filters.brand}
            onChange={(v) => set("model", v ?? undefined)}
          />
        </div>
      </Section>

      <Section title="Body type">
        <Pills
          label="Body type"
          value={filters.bodyType}
          items={bodyTypes.map((t) => ({ value: t, label: ENUM_LABELS.bodyType[t] }))}
          onChange={(v) => set("bodyType", v as CarFilters["bodyType"])}
        />
      </Section>

      <Section title="Powertrain">
        <Pills
          label="Powertrain"
          value={filters.powertrain}
          items={powertrains.map((p) => ({ value: p, label: ENUM_LABELS.powertrain[p] }))}
          onChange={(v) => set("powertrain", v as CarFilters["powertrain"])}
        />
      </Section>

      <div className="grid grid-cols-2 gap-4">
        <Section title="Transmission">
          <Pills
            label="Transmission"
            value={filters.transmission}
            items={transmissions.map((t) => ({ value: t, label: ENUM_LABELS.transmission[t] }))}
            onChange={(v) => set("transmission", v as CarFilters["transmission"])}
          />
        </Section>
        <Section title="Drivetrain">
          <Pills
            label="Drivetrain"
            value={filters.drivetrain}
            items={drivetrains.map((d) => ({ value: d, label: d.toUpperCase() }))}
            onChange={(v) => set("drivetrain", v as CarFilters["drivetrain"])}
          />
        </Section>
      </div>

      <Section title="Color">
        <ToggleGroup
          aria-label="Color"
          value={filters.color ? [filters.color] : []}
          onValueChange={(value) => set("color", value[0] as CarFilters["color"])}
          className="flex-wrap gap-2"
        >
          {colors.map((color) => (
            <ToggleGroupItem
              key={color.name}
              value={color.name}
              aria-label={color.name}
              title={color.name}
              className={cn(
                "size-7 rounded-full border-0 p-0 ring-2 ring-transparent ring-offset-2 ring-offset-background transition-all",
                "hover:ring-foreground/30 data-pressed:ring-foreground",
              )}
              style={{ background: color.hex }}
            >
              {filters.color === color.name ? (
                <Check className="size-3.5 drop-shadow" style={{ color: color.name === "White" || color.name === "Beige" || color.name === "Silver" || color.name === "Yellow" ? "#111" : "#fff" }} aria-hidden="true" />
              ) : null}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Section>

      <div className="grid grid-cols-2 gap-4">
        <Section title="Seats">
          <SelectField
            label="Seats"
            value={filters.minSeats?.toString()}
            placeholder="Any"
            items={seatOptions.map((n) => ({ value: String(n), label: `${n}+ seats` }))}
            onChange={(v) => set("minSeats", v ? Number(v) : undefined)}
          />
        </Section>
        <Section title="Equipment">
          {options.towHitch || filters.towHitch !== undefined ? (
            <div className="flex h-8 items-center gap-2">
              <Switch id={`${id}-tow`} checked={filters.towHitch === true} onCheckedChange={(checked) => set("towHitch", checked ? true : undefined)} />
              <Label htmlFor={`${id}-tow`} className="text-sm">
                Tow hitch
              </Label>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">None in stock</p>
          )}
        </Section>
      </div>

      <Section title="Model year">
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="From year"
            value={filters.yearFrom?.toString()}
            placeholder="From"
            items={options.years.map((y) => ({ value: String(y), label: String(y) }))}
            onChange={(v) => set("yearFrom", v ? Number(v) : undefined)}
          />
          <SelectField
            label="To year"
            value={filters.yearTo?.toString()}
            placeholder="To"
            items={options.years.map((y) => ({ value: String(y), label: String(y) }))}
            onChange={(v) => set("yearTo", v ? Number(v) : undefined)}
          />
        </div>
      </Section>

      <Section title="Feature">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={`${id}-feature`}
            aria-label="Feature"
            className="pl-8"
            placeholder="e.g. heated seats"
            value={feature}
            onChange={(event) => setFeature(event.target.value)}
            onBlur={(event) => commitFeature(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitFeature(event.currentTarget.value);
            }}
          />
        </div>
      </Section>
    </div>
  );
}

export type FilterSummaryProps = {
  filters: CarFilters;
  onChange: (filters: CarFilters) => void;
  resultCount: number;
  /** Rendered on the left, for the mobile filter button. */
  leading?: React.ReactNode;
  /** Rendered on the right, for the view toggle. */
  trailing?: React.ReactNode;
  className?: string;
};

/** Result count, active filter chips, and clear all. Sits above the car grid. */
export function FilterSummary({ filters, onChange, resultCount, leading, trailing, className }: FilterSummaryProps) {
  const active = CAR_FILTER_KEYS.filter((key) => filters[key] !== undefined);
  return (
    <div className={cn("flex min-h-9 flex-wrap items-center gap-2", className)}>
      {leading}
      <span className="text-sm font-medium tabular-nums" aria-live="polite">
        {resultCount} {resultCount === 1 ? "car" : "cars"}
      </span>
      {active.length > 0 ? <span className="text-muted-foreground">·</span> : null}
      {active.map((key) => {
        const label = filterChipLabel(key, filters[key]);
        return (
          <Badge key={key} variant="secondary" className="gap-1 pr-1">
            {label}
            <button
              type="button"
              aria-label={`Remove filter ${label}`}
              className="rounded-full p-0.5 hover:bg-foreground/10"
              onClick={() => onChange(applyChange(filters, key, undefined))}
            >
              <X className="size-3" />
            </button>
          </Badge>
        );
      })}
      {hasActiveFilters(filters) ? (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          Clear all
        </Button>
      ) : null}
      {trailing}
    </div>
  );
}

export function FilterPanelHeading({ filters, onChange }: { filters: CarFilters; onChange: (f: CarFilters) => void }) {
  const count = countActiveFilters(filters);
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
        Filters
        {count > 0 ? <Badge variant="secondary">{count}</Badge> : null}
      </h2>
      {count > 0 ? (
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onChange({})}>
          Reset
        </Button>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Pills({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string | undefined;
  items: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">None in stock</p>;
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      size="sm"
      value={value ? [value] : []}
      onValueChange={(next) => onChange(next[0])}
      className="flex-wrap gap-1.5"
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          className="h-7 rounded-full border px-3 text-xs data-pressed:border-primary data-pressed:bg-primary data-pressed:text-primary-foreground"
        >
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  value: string | undefined;
  placeholder: string;
  items: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  const allItems = [{ value: ANY, label: placeholder }, ...items];
  return (
    <Select items={allItems} value={value ?? ANY} onValueChange={(next) => onChange(next === ANY || next === null ? undefined : next)}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SearchField({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}) {
  return (
    <Combobox items={options} value={value} onValueChange={(next) => onChange(next)} disabled={disabled}>
      <ComboboxInput aria-label={label} placeholder={placeholder} disabled={disabled} showClear className="w-full" />
      <ComboboxContent>
        <ComboboxEmpty>No match.</ComboboxEmpty>
        <ComboboxList>
          {(option: string) => (
            <ComboboxItem key={option} value={option}>
              {option}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
