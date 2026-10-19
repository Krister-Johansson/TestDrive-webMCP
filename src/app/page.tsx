import type { Metadata } from "next";
import { BrowsePage } from "@/components/booking/browse-page";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Book a test drive" };

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <BrowsePage searchParams={await searchParams} />;
}
