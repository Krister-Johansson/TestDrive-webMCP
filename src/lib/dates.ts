/** Calendar day as YYYY-MM-DD, the only date format tools and URLs accept. */
export const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const ISO_DAY_PATTERN_SOURCE = "^\\d{4}-\\d{2}-\\d{2}$";

export function isIsoDay(value: unknown): value is string {
  return typeof value === "string" && ISO_DAY_PATTERN.test(value);
}
