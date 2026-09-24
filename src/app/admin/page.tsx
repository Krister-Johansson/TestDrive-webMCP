import type { Metadata } from "next";
import { AdminTabs, type AdminTab } from "@/components/admin/admin-tabs";
import { BookingsTable } from "@/components/admin/bookings-table";
import { BrandsPanel } from "@/components/admin/brands-panel";
import { CarsTable } from "@/components/admin/cars-table";
import { SlotGenerator } from "@/components/admin/slot-generator";
import { SlotOverview } from "@/components/admin/slot-overview";
import { AdminToolset } from "@/components/webmcp/admin-tools";
import { cancelBookingAction, createBrandAction, createModelAction, generateSlotsAction } from "@/lib/actions";
import { toLocalDay } from "@/lib/booking-service";
import { getBookingService } from "@/lib/service";

export const metadata: Metadata = { title: "Admin" };

const TABS: AdminTab[] = ["cars", "brands", "slots", "bookings"];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { tab } = await searchParams;
  const active = TABS.includes(tab as AdminTab) ? (tab as AdminTab) : "cars";
  const service = getBookingService();
  const cars = service.findCars({}, { includeInactive: true });
  const brands = service.listBrands();
  const bookings = service.listBookings();
  const today = toLocalDay(new Date());
  const overview = cars
    .filter((car) => car.active)
    .map((car) => {
      const days = service.listSlotDays(car.id).filter((day) => day.date >= today);
      return {
        carId: car.id,
        car: `${car.brand} ${car.model}`,
        days: days.length,
        total: days.reduce((sum, day) => sum + day.total, 0),
        available: days.reduce((sum, day) => sum + day.available, 0),
        nextDay: days.find((day) => day.available > 0)?.date ?? null,
      };
    });

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">Manage the fleet, schedule slots, and keep an eye on bookings.</p>
      </div>
      <AdminToolset />
      <AdminTabs
        tab={active}
        cars={<CarsTable cars={cars} brands={brands} />}
        brands={<BrandsPanel brands={brands} addBrand={createBrandAction} addModel={createModelAction} />}
        slots={
          <div className="space-y-6">
            <SlotGenerator
              cars={cars.filter((car) => car.active).map((car) => ({ id: car.id, label: `${car.brand} ${car.model}` }))}
              onSubmit={generateSlotsAction}
            />
            <SlotOverview rows={overview} />
          </div>
        }
        bookings={<BookingsTable bookings={bookings} cancel={cancelBookingAction} />}
      />
    </main>
  );
}
