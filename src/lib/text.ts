/** "Zhong Liu" → "ZL": the monogram shown when a portrait is missing. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join("");
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * "2024-10-19" → "October 19, 2024", read straight off the string. Deliberately not
 * `new Date()`: a date-only value parses as UTC midnight, which renders as the day
 * before anywhere west of Greenwich. Returns null for anything that is not a real
 * calendar date, so a typo shows nothing rather than "undefined NaN".
 */
export function formatIsoDate(iso: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) return null;
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}
