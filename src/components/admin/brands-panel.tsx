"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Brand, Model } from "@/db/schema";
import type { ActionResult } from "@/lib/actions";
import type { BrandTree } from "@/lib/booking-service";

export type BrandsPanelProps = {
  brands: BrandTree[];
  addBrand: (name: string) => Promise<ActionResult<Brand>>;
  addModel: (brandId: string, name: string) => Promise<ActionResult<Model>>;
};

export function BrandsPanel({ brands, addBrand, addModel }: BrandsPanelProps) {
  const [newBrand, setNewBrand] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitBrand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newBrand.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await addBrand(name);
      if (result.ok) {
        setNewBrand("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submitBrand} className="flex flex-wrap items-end gap-2 rounded-xl border p-4">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="new-brand" className="text-sm font-medium">
            New brand
          </label>
          <Input id="new-brand" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="e.g. Volvo" />
        </div>
        <Button type="submit" disabled={pending || !newBrand.trim()}>
          <Plus aria-hidden="true" /> Add brand
        </Button>
      </form>
      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {brands.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No brands yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {brands.map((brand) => (
            <li key={brand.id} className="rounded-xl border p-4">
              <BrandCard brand={brand} addModel={addModel} onError={setError} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BrandCard({
  brand,
  addModel,
  onError,
}: {
  brand: BrandTree;
  addModel: BrandsPanelProps["addModel"];
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onError(null);
    startTransition(async () => {
      const result = await addModel(brand.id, trimmed);
      if (result.ok) {
        setName("");
      } else {
        onError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">{brand.name}</h3>
      {brand.models.length === 0 ? (
        <p className="text-sm text-muted-foreground">No models yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {brand.models.map((model) => (
            <li key={model.id} className="rounded-md bg-muted px-2 py-0.5 text-sm">
              {model.name}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <Input
          aria-label={`New model for ${brand.name}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. V70"
          className="h-8"
        />
        <Button type="submit" size="sm" variant="outline" aria-label={`Add model to ${brand.name}`} disabled={pending || !name.trim()}>
          <Plus aria-hidden="true" /> Add
        </Button>
      </form>
    </div>
  );
}
