/**
 * Centres `item` in a horizontally scrolling `strip` by moving the strip's own
 * scroll position — never `scrollIntoView`, which would also scroll the page.
 * Used by the date rail and the photo viewer's thumbnails.
 */
export function centreInStrip(strip: HTMLElement, item: HTMLElement) {
  strip.scrollTo?.({
    left: item.offsetLeft - (strip.clientWidth - item.offsetWidth) / 2,
    behavior: "smooth",
  });
}
