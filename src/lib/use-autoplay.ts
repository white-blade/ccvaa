import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia?.(REDUCED_MOTION);
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

const prefersReducedMotion = () => window.matchMedia?.(REDUCED_MOTION).matches ?? false;

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const pageVisible = () => document.visibilityState !== "hidden";

type UseAutoplayOptions = {
  /** Milliseconds between advances. */
  interval: number;
  onAdvance: () => void;
  /**
   * Hold the slideshow without changing the visitor's choice: while the pointer is
   * over it, keyboard focus is in it, or the viewer is open over it.
   */
  held: boolean;
  /** Changes whenever the slide does, so a manual step restarts the countdown. */
  restartKey: unknown;
};

type UseAutoplayResult = {
  /** The visitor's choice, as the pause/play button shows it. */
  playing: boolean;
  /** Whether a slide will actually advance on its own right now. */
  running: boolean;
  toggle: () => void;
};

/**
 * A slideshow that advances on its own, within the rules of WCAG 2.2.2: it plays
 * only until the visitor pauses it, and holds while they look closely (`held`) or
 * the tab is hidden. Under reduced motion it starts paused — the visitor may still
 * press play, and then it is their choice, not autoplay.
 *
 * One timeout per slide rather than an interval, so stepping by hand always gives
 * the new photograph its full time on screen.
 */
export function useAutoplay({
  interval,
  onAdvance,
  held,
  restartKey,
}: UseAutoplayOptions): UseAutoplayResult {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false,
  );
  const visible = useSyncExternalStore(subscribeVisibility, pageVisible, () => true);
  const [choice, setChoice] = useState<boolean | null>(null);

  const playing = choice ?? !reducedMotion;
  const running = playing && !held && visible;

  const advance = useRef(onAdvance);
  useEffect(() => {
    advance.current = onAdvance;
  });

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => advance.current(), interval);
    return () => window.clearTimeout(timer);
  }, [running, interval, restartKey]);

  return { playing, running, toggle: () => setChoice(!playing) };
}
