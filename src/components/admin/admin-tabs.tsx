"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AdminTab = "cars" | "brands" | "slots" | "bookings";

export function AdminTabs({
  tab,
  cars,
  brands,
  slots,
  bookings,
}: {
  tab: AdminTab;
  cars: React.ReactNode;
  brands: React.ReactNode;
  slots: React.ReactNode;
  bookings: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => router.replace(`/admin?tab=${value}`, { scroll: false })}
      className="gap-6"
    >
      <TabsList>
        <TabsTrigger value="cars">Cars</TabsTrigger>
        <TabsTrigger value="brands">Brands</TabsTrigger>
        <TabsTrigger value="slots">Slots</TabsTrigger>
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
      </TabsList>
      <TabsContent value="cars">{cars}</TabsContent>
      <TabsContent value="brands">{brands}</TabsContent>
      <TabsContent value="slots">{slots}</TabsContent>
      <TabsContent value="bookings">{bookings}</TabsContent>
    </Tabs>
  );
}
