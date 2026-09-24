import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">That page does not exist</h1>
      <p className="text-muted-foreground">The car or booking you are looking for may have been removed.</p>
      <Link href="/" className={buttonVariants()}>
        Back to the fleet
      </Link>
    </main>
  );
}
