export type ResultsView = "cards" | "table";
/** Versioned so a later change in meaning can start fresh. */
export const RESULTS_VIEW_COOKIE = "testdrive.results-view.v1";

export function parseResultsView(value: string | undefined): ResultsView {
  return value === "table" ? "table" : "cards";
}
