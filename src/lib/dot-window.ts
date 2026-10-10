/** At most this many dots show, however large the gallery grows. */
export const MAX_DOTS = 7;
/** Below `sm` there is room for fewer, beside four buttons at 320px. */
export const MAX_DOTS_NARROW = 5;

export type DotScale = "small" | "medium" | "full";

/**
 * The slideshow's dots on show: a window of at most `MAX_DOTS`, so twenty works or
 * two hundred take the same row. Where it starts is `from` — kept as the visitor
 * steps, see `nextDotStart` — or, by default, one before the current work. At the
 * ends the window stops: the first works show 1–7, the last ones the final seven.
 *
 * Dots at a window edge with more beyond them are drawn smaller, the way a phone's
 * page indicator says "there is more this way" — but never the current one. The
 * counter beside the credits says exactly where you are; the viewer's thumbnails
 * jump anywhere, and the first/last buttons to either end.
 *
 * A narrower window (`MAX_DOTS_NARROW`) follows the same rule and always lies inside
 * the wider one, so a small screen can simply hide the dots outside it.
 */
export function dotWindow(index: number, count: number, max: number = MAX_DOTS, from?: number) {
  const size = Math.min(count, max);
  const start = clampStart(from ?? index - 1, count, size);
  const end = start + size;
  const scale = (dot: number): DotScale => {
    if (dot === index) return "full";
    const fromStart = start > 0 ? dot - start : Infinity;
    const fromEnd = end < count ? end - 1 - dot : Infinity;
    const edge = Math.min(fromStart, fromEnd);
    return edge === 0 ? "small" : edge === 1 ? "medium" : "full";
  };
  return { start, end, scale };
}

function clampStart(start: number, count: number, size: number) {
  return Math.min(Math.max(start, 0), Math.max(count - size, 0));
}

/**
 * Where the window should start after moving from `previous` to `index`.
 *
 * A step (one forward or back) moves the current dot along the row, and the window
 * only slides when that dot would reach an edge — one dot stays visible on either
 * side — so a visitor stepping through sees the highlight travel, as on a phone's
 * page indicator. A jump (a dot, first/last, the viewer, wrapping past an end)
 * places the window afresh, one before the current work: jump to the 11th and the
 * dots run 10–16.
 */
export function nextDotStart(
  previous: { index: number; start: number },
  index: number,
  count: number,
  max: number = MAX_DOTS,
): number {
  const size = Math.min(count, max);
  if (index === previous.index) return clampStart(previous.start, count, size);
  if (Math.abs(index - previous.index) > 1) return clampStart(index - 1, count, size);
  let start = previous.start;
  if (index < start + 1) start = index - 1;
  else if (index > start + size - 2) start = index - size + 2;
  return clampStart(start, count, size);
}
