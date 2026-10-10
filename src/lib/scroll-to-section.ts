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

/**
 * Eases the window to `to`, then calls `onArrive`. Any wheel, touch, or key from the
 * visitor cancels it; reduced motion jumps straight there.
 */
function glide(to: number, onArrive: () => void) {
  cancelGlide?.();
  const from = window.scrollY;
  const distance = to - from;

  if (prefersReducedMotion() || Math.abs(distance) < 2) {
    window.scrollTo({ top: to, behavior: "instant" });
    onArrive();
    return;
  }

  // Longer trips take longer, within limits that keep both ends feeling deliberate.
  const duration = Math.min(1100, Math.max(450, 250 + Math.abs(distance) * 0.25));
  const startedAt = performance.now();
  let frame = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
    cancelGlide = null;
  };
  cancelGlide = stop;
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);

  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    window.scrollTo({ top: from + distance * easeInOutCubic(progress), behavior: "instant" });
    if (progress < 1) {
      frame = requestAnimationFrame(step);
    } else {
      stop();
      onArrive();
    }
  };
  frame = requestAnimationFrame(step);
}

/**
 * Glides to `#id` (or the top for `#top`). Returns false when there is no such
 * section, so the caller can let the browser handle the link as usual.
 */
export function scrollToSection(hash: string): boolean {
  const id = hash.replace(/^#/, "");
  const section = id === "top" ? null : document.getElementById(id);
  if (id !== "top" && !section) return false;

  if (window.location.hash !== hash) {
    window.history.pushState(null, "", hash);
  }
  glide(targetTop(section), () => arrive(section));
  return true;
}

/**
 * Glides until `element` sits `offset` pixels below the top of the viewport — past
 * the header and anything sticky under it — then gives it focus, so a keyboard user
 * lands where the eye does.
 */
export function glideTo(element: HTMLElement, offset: number) {
  const to = Math.max(0, element.getBoundingClientRect().top + window.scrollY - offset);
  glide(to, () => element.focus({ preventScroll: true }));
}
