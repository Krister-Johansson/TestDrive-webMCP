import { BrowsePage } from "@/components/booking/browse-page";
import type { SearchParams } from "@/lib/search-params";

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <BrowsePage searchParams={await searchParams} />;
}
