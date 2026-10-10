import type { TouchEvent as ReactTouchEvent } from "react";

export type Point = { x: number; y: number };
export type Swipe = "left" | "right" | "down";

/** Minimum travel, in px, for a swipe to count. */
const MIN_SIDEWAYS = 50;
const MIN_DOWN = 60;
/** A swipe must favour its axis by this factor, so diagonals, scrolls, and pinches do not count. */
const AXIS_BIAS = 1.5;

/** The one-finger swipe from `from` to `to`, or null if it is not clearly one. */
export function swipeBetween(from: Point, to: Point): Swipe | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dy > MIN_DOWN && dy > Math.abs(dx) * AXIS_BIAS) return "down";
  if (Math.abs(dx) >= MIN_SIDEWAYS && Math.abs(dx) >= Math.abs(dy) * AXIS_BIAS) {
    return dx < 0 ? "left" : "right";
  }
  return null;
}

/** Where a one-finger touch starts, or null for multi-finger gestures (pinch). */
export function singleTouch(event: TouchEvent | ReactTouchEvent): Point | null {
  return event.touches.length === 1
    ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
    : null;
}

export function touchEnd(event: TouchEvent | ReactTouchEvent): Point {
  const touch = event.changedTouches[0];
  return { x: touch.clientX, y: touch.clientY };
}
