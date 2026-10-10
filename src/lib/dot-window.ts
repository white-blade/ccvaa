/** At most this many dots show, however large the gallery grows. */
export const MAX_DOTS = 7;

export type DotScale = "small" | "medium" | "full";

/**
 * The slideshow's dots on show: a window of at most `MAX_DOTS` that slides to keep
 * the current one near its middle, so twenty works or two hundred take the same
 * row. Dots at a window edge with more beyond them are drawn smaller, the way a
 * phone's page indicator says "there is more this way". The counter beside the
 * credits says exactly where you are; the viewer's thumbnails jump anywhere.
 */
export function dotWindow(index: number, count: number) {
  const size = Math.min(count, MAX_DOTS);
  const start = Math.min(Math.max(index - Math.floor(size / 2), 0), Math.max(count - size, 0));
  const end = start + size;
  const scale = (dot: number): DotScale => {
    const fromStart = start > 0 ? dot - start : Infinity;
    const fromEnd = end < count ? end - 1 - dot : Infinity;
    const edge = Math.min(fromStart, fromEnd);
    return edge === 0 ? "small" : edge === 1 ? "medium" : "full";
  };
  return { start, end, scale };
}
