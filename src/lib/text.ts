/** "Zhong Liu" → "ZL": the monogram shown when a portrait is missing. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join("");
}
