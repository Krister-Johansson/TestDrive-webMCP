/** Hosts the Next.js image optimizer may fetch from (see next.config.ts remotePatterns). */
const OPTIMIZED_HOSTS = new Set(["upload.wikimedia.org", "thumb.wikimedia.org"]);

/**
 * Local files and allow-listed hosts go through the optimizer; anything else is served as-is,
 * so an admin can paste any https URL without a 400 from the optimizer.
 */
export function isOptimizableImage(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}
