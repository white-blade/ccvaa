/** At most this many dots show, however large the gallery grows. */
export const MAX_DOTS = 7;
/** Below `sm` there is room for fewer, beside four buttons at 320px. */
export const MAX_DOTS_NARROW = 5;

export type DotScale = "small" | "medium" | "full";

/**
 * The slideshow's dots on show: a window of at most `MAX_DOTS` that starts one
 * before the current work — the one just seen stays in reach, the rest lie ahead —
 * so twenty works or two hundred take the same row. On the 11th work the dots run
 * 10–16. At the ends the window stops: the first works show 1–7, the last ones the
 * final seven.
 *
 * Dots at a window edge with more beyond them are drawn smaller, the way a phone's
 * page indicator says "there is more this way" — but never the current one. The
 * counter beside the credits says exactly where you are; the viewer's thumbnails
 * jump anywhere, and the first/last buttons to either end.
 *
 * A narrower window (`MAX_DOTS_NARROW`) follows the same rule and always lies inside
 * the wider one, so a small screen can simply hide the dots outside it.
 */
export function dotWindow(index: number, count: number, max: number = MAX_DOTS) {
  const size = Math.min(count, max);
  const start = Math.min(Math.max(index - 1, 0), Math.max(count - size, 0));
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
