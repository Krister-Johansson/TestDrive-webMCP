"use client";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import type { BrandTree } from "@/lib/booking-service";

export type BrandModelValue = { brand: string; model: string };

type PickerItem = { value: string; label: string; brand: string; model: string };
type PickerGroup = { value: string; items: PickerItem[] };

export function BrandModelPicker({
  brands,
  value,
  onChange,
  id,
  placeholder = "Search brand or model",
}: {
  brands: BrandTree[];
  value: BrandModelValue | null;
  onChange: (value: BrandModelValue | null) => void;
  id?: string;
  placeholder?: string;
}) {
  const groups: PickerGroup[] = brands.map((brand) => ({
    value: brand.name,
    items: brand.models.map((model) => ({
      value: model.id,
      label: model.name,
      brand: brand.name,
      model: model.name,
    })),
  }));
  const selected =
    groups.flatMap((group) => group.items).find((item) => item.brand === value?.brand && item.model === value?.model) ?? null;

  return (
    <Combobox<PickerItem, false>
      items={groups}
      value={selected}
      onValueChange={(next) => onChange(next ? { brand: next.brand, model: next.model } : null)}
      itemToStringLabel={(item) => `${item.brand} ${item.model}`}
      itemToStringValue={(item) => item.value}
      isItemEqualToValue={(a, b) => a.value === b.value}
    >
      <ComboboxInput id={id} aria-label="Brand and model" placeholder={placeholder} showClear className="w-full" />
      <ComboboxContent>
        <ComboboxEmpty>No brand or model matches.</ComboboxEmpty>
        <ComboboxList>
          {(group: PickerGroup) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item: PickerItem) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
