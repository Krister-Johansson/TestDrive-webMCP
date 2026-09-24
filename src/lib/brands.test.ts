import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/db";
import { SEED_CARS } from "@/db/seed";
import { createBookingService, ValidationError, type BookingService } from "./booking-service";
import { createEventBus } from "./events";

describe("brands and models", () => {
  let service: BookingService;
  beforeEach(() => {
    service = createBookingService(createTestDb(), createEventBus());
  });

  it("creates brands and models and lists them as a tree", () => {
    const volvo = service.createBrand("Volvo");
    service.createModel(volvo.id, "V70");
    service.createModel(volvo.id, "XC60");
    const aldo = service.createBrand("Aldo");
    service.createModel(aldo.id, "Sera");
    expect(service.listBrands()).toEqual([
      { id: aldo.id, name: "Aldo", models: [expect.objectContaining({ name: "Sera" })] },
      { id: volvo.id, name: "Volvo", models: [expect.objectContaining({ name: "V70" }), expect.objectContaining({ name: "XC60" })] },
    ]);
  });

  it("rejects duplicate brands and models case-insensitively and empty names", () => {
    const volvo = service.createBrand("Volvo");
    expect(() => service.createBrand("volvo")).toThrow(ValidationError);
    expect(() => service.createBrand("  ")).toThrow(ValidationError);
    service.createModel(volvo.id, "V70");
    expect(() => service.createModel(volvo.id, "v70")).toThrow(ValidationError);
    expect(() => service.createModel("missing", "V70")).toThrow(/brand/i);
  });

  it("creating a car reuses an existing brand and model or creates them", () => {
    const first = service.createCar(SEED_CARS[0]);
    const second = service.createCar({ ...SEED_CARS[0], color: "Black" });
    expect(first.brand).toBe("Norra");
    expect(first.model).toBe("Fjell");
    expect(first.modelId).toBe(second.modelId);
    expect(service.listBrands()).toEqual([
      { id: first.brandId, name: "Norra", models: [expect.objectContaining({ id: first.modelId, name: "Fjell" })] },
    ]);
    const other = service.createCar({ ...SEED_CARS[0], brand: "norra", model: "Vik" });
    expect(other.brandId).toBe(first.brandId);
    expect(service.listBrands()[0].models.map((m) => m.name)).toEqual(["Fjell", "Vik"]);
  });

  it("exposes the color hex from the fixed list", () => {
    const car = service.createCar({ ...SEED_CARS[0], color: "Red" });
    expect(car.colorHex).toBe("#b3261e");
    expect(() => service.createCar({ ...SEED_CARS[0], color: "Rosso" as never })).toThrow(/color/i);
  });

  it("stores ordered images and replaces them on update", () => {
    const car = service.createCar({
      ...SEED_CARS[0],
      images: [
        { url: "https://example.com/a.jpg", credit: "A" },
        { url: "https://example.com/b.jpg", credit: "B", sourceUrl: "https://example.com/b" },
      ],
    });
    expect(car.images.map((i) => i.url)).toEqual(["https://example.com/a.jpg", "https://example.com/b.jpg"]);
    expect(car.images[1].sourceUrl).toBe("https://example.com/b");
    const updated = service.updateCar(car.id, { images: [{ url: "https://example.com/c.jpg" }] });
    expect(updated.images.map((i) => i.url)).toEqual(["https://example.com/c.jpg"]);
    expect(service.findCars({})[0].images).toHaveLength(1);
    expect(() => service.createCar({ ...SEED_CARS[0], images: [{ url: "ftp://nope" }] })).toThrow(/http/);
    expect(service.createCar({ ...SEED_CARS[0], images: [{ url: "/cars/local.jpg" }] }).images[0].url).toBe("/cars/local.jpg");
  });

  it("filters by model and by exact color", () => {
    service.createCar(SEED_CARS[0]);
    service.createCar(SEED_CARS[1]);
    expect(service.findCars({ model: "vik" }).map((c) => c.model)).toEqual(["Vik"]);
    expect(service.findCars({ brand: "Norra", model: "Fjell" })).toHaveLength(1);
    expect(service.findCars({ color: SEED_CARS[1].color }).map((c) => c.model)).toEqual(["Vik"]);
    expect(service.findCars({ color: "Yellow" })).toEqual([]);
  });

  it("updates a car's brand and model by name", () => {
    const car = service.createCar(SEED_CARS[0]);
    const updated = service.updateCar(car.id, { brand: "Volvo", model: "V70" });
    expect(updated.brand).toBe("Volvo");
    expect(updated.model).toBe("V70");
    expect(service.findCar(car.id)?.model).toBe("V70");
    expect(service.findCar("Volvo V70")?.id).toBe(car.id);
  });
});
