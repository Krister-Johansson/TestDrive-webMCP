"use client";

import { useRouter } from "next/navigation";
import { startTransition, useOptimistic, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AdminTab = "cars" | "brands" | "slots" | "bookings";

const TABS: { value: AdminTab; label: string }[] = [
  { value: "cars", label: "Cars" },
  { value: "brands", label: "Brands" },
  { value: "slots", label: "Slots" },
  { value: "bookings", label: "Bookings" },
];

/** Routing-driven tabs: the URL is the source of truth, the strip updates optimistically. */
export function AdminTabs({ tab, children }: { tab: AdminTab; children: ReactNode }) {
  const router = useRouter();
  const [optimisticTab, setOptimisticTab] = useOptimistic(tab);
  return (
    <Tabs
      value={optimisticTab}
      onValueChange={(value) => {
        startTransition(() => {
          setOptimisticTab(value as AdminTab);
          router.replace(`/admin?tab=${value}`, { scroll: false });
        });
      }}
      className="gap-6"
    >
      <TabsList>
        {TABS.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

export function AdminTabPanel({ value, children }: { value: AdminTab; children: ReactNode }) {
  return <TabsContent value={value}>{children}</TabsContent>;
}
