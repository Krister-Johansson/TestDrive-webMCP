export type SearchParams = Record<string, string | string[] | undefined>;

export function toSearchParams(params: SearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") out.set(key, value);
  }
  return out;
}

/** The query string for links, with optional overrides; null removes a key. */
export function queryFrom(params: SearchParams | URLSearchParams, overrides: Record<string, string | null> = {}): string {
  const out = params instanceof URLSearchParams ? new URLSearchParams(params) : toSearchParams(params);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) out.delete(key);
    else out.set(key, value);
  }
  return out.toString();
}

export function withQuery(path: string, query: string): string {
  return query ? `${path}?${query}` : path;
}
