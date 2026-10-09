import { useSyncExternalStore } from "react";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** The visitor's local date as ISO — compared against ISO event dates as strings. */
function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function subscribe(): () => void {
  return () => {};
}

/**
 * Today's date, or `null` during prerender. The HTML is built once at `next build`,
 * so "today" there would be the build date; components fall back to a date-neutral
 * render and React fills in the real day right after hydration.
 */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, localToday, () => null);
}
