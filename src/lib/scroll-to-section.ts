/**
 * In-page navigation with a little ceremony: an eased glide to the section, then
 * an "arrival" flourish on its heading (styled in globals.css under
 * `[data-arrived]`), and focus moved to the section so keyboard and screen-reader
 * users land where sighted users do.
 *
 * With reduced motion it is a plain jump. Any wheel, touch, or key from the visitor
 * cancels a glide in progress — the page never fights the person scrolling it.
 */

const ARRIVAL_MS = 1400;

/**
 * Announced on `window` when a section glide starts and when it settles (arrived or
 * cancelled). `target` is the section id, or null for the top of the page. Lets the
 * nav mark the destination for the whole trip instead of flickering through every
 * section it passes. `arrived` is set when a settled glide reached its target, as
 * opposed to being cancelled by the visitor.
 */
export const SECTION_GLIDE_EVENT = "ccvaa:section-glide";
export type SectionGlideDetail = { target: string | null; gliding: boolean; arrived?: boolean };

function announce(detail: SectionGlideDetail) {
  window.dispatchEvent(new CustomEvent<SectionGlideDetail>(SECTION_GLIDE_EVENT, { detail }));
}

let cancelGlide: (() => void) | null = null;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function arrive(section: HTMLElement | null) {
  if (!section) return;
  section.focus({ preventScroll: true });
  section.setAttribute("data-arrived", "");
  window.setTimeout(() => section.removeAttribute("data-arrived"), ARRIVAL_MS);
}

/** Where the window should stop so the section sits just under the fixed header. */
function targetTop(section: HTMLElement | null): number {
  if (!section) return 0;
  const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
  return Math.max(0, section.getBoundingClientRect().top + window.scrollY - margin);
}

/** After landing, how long the glide keeps its section in place while the page settles. */
const SETTLE_MS = 1000;
/** How long past its duration a glide waits for frames before finishing without them. */
const STALL_GRACE_MS = 400;

/**
 * Eases the window to `to()`, then calls `onArrive`. Any wheel, touch, or key from
 * the visitor cancels it; reduced motion jumps straight there.
 *
 * Built to land on a slow or busy device, not just a fast one:
 * - `to` is read again on every frame, so the glide still lands on its section when
 *   the page above it changes height on the way (a picture loading, cards measuring
 *   themselves once the fonts arrive).
 * - The clock starts on the first frame, not at the call, so a device slow to paint
 *   still shows the glide instead of jumping to the end.
 * - If frames stop coming altogether (a browser starving a page of them), a timer
 *   finishes the trip: it arrives, just without the ease.
 * - For a moment after landing, the section is held in place if the page above it
 *   shifts. Safari has no scroll anchoring, so a late picture or font would otherwise
 *   leave the visitor short of where they asked to go.
 */
function glide(to: () => number, onArrive: () => void, onSettle?: () => void) {
  cancelGlide?.();
  const from = window.scrollY;
  const distance = to() - from;

  if (prefersReducedMotion() || Math.abs(distance) < 2) {
    window.scrollTo({ top: to(), behavior: "instant" });
    onArrive();
    onSettle?.();
    return;
  }

  // Longer trips take longer, within limits that keep both ends feeling deliberate.
  const duration = Math.min(1100, Math.max(450, 250 + Math.abs(distance) * 0.25));
  let startedAt: number | null = null;
  let frame = 0;
  let arrived = false;
  let settleTimer = 0;
  let resizes: ResizeObserver | null = null;

  const stop = () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(stallTimer);
    window.clearTimeout(settleTimer);
    resizes?.disconnect();
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
    cancelGlide = null;
    onSettle?.();
  };
  cancelGlide = stop;
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);

  const pin = () => {
    const target = to();
    if (Math.abs(window.scrollY - target) > 1) window.scrollTo({ top: target, behavior: "instant" });
  };

  const land = () => {
    if (arrived) return;
    arrived = true;
    cancelAnimationFrame(frame);
    window.clearTimeout(stallTimer);
    pin();
    onArrive();
    if (typeof ResizeObserver !== "undefined") {
      resizes = new ResizeObserver(pin);
      resizes.observe(document.body);
    }
    settleTimer = window.setTimeout(stop, SETTLE_MS);
  };

  const step = (now: number) => {
    startedAt ??= now;
    const progress = Math.min(1, (now - startedAt) / duration);
    window.scrollTo({ top: from + (to() - from) * easeInOutCubic(progress), behavior: "instant" });
    if (progress < 1) frame = requestAnimationFrame(step);
    else land();
  };
  frame = requestAnimationFrame(step);
  const stallTimer = window.setTimeout(land, duration + STALL_GRACE_MS);
}

/**
 * Glides to `#id` (or the top for `#top` or an empty hash). Returns false when there
 * is no such section, so the caller can let the browser handle the link as usual.
 *
 * `history: "push"` (the default, for clicked links) adds a history entry so Back
 * returns; `"none"` is for Back/Forward themselves, which have already moved it.
 */
export function scrollToSection(
  hash: string,
  { history = "push" }: { history?: "push" | "none" } = {},
): boolean {
  const id = hash.replace(/^#/, "");
  const toTop = id === "" || id === "top";
  const section = toTop ? null : document.getElementById(id);
  if (!toTop && !section) return false;

  // The top of the page is the bare URL, not "#top".
  const url = toTop ? window.location.pathname + window.location.search : `#${id}`;
  if (history === "push" && window.location.hash !== (toTop ? "" : `#${id}`)) {
    window.history.pushState(null, "", url);
  }

  const target = toTop ? null : id;
  let arrived = false;
  announce({ target, gliding: true });
  glide(
    () => targetTop(section),
    () => {
      arrived = true;
      arrive(section);
    },
    () => announce({ target, gliding: false, arrived }),
  );
  return true;
}

/**
 * Glides until `element` sits `offset` pixels below the top of the viewport — past
 * the header and anything sticky under it — then gives it focus, so a keyboard user
 * lands where the eye does, and calls `onArrive`.
 */
export function glideTo(element: HTMLElement, offset: number, onArrive?: () => void) {
  const to = () => Math.max(0, element.getBoundingClientRect().top + window.scrollY - offset);
  glide(to, () => {
    element.focus({ preventScroll: true });
    onArrive?.();
  });
}
