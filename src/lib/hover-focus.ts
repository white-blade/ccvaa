import type { FocusEvent, PointerEvent } from "react";

/**
 * Pointer hover and keyboard focus as one signal, so whatever a mouse user sees on
 * hover a keyboard user sees on focus.
 *
 * Touch is left out on purpose. A tap fires emulated enter and focus events with no
 * matching leave, which would strand the highlight on whatever was last tapped. So
 * enter/leave count only for a mouse or pen, and focus only when it is keyboard
 * focus (`:focus-visible`).
 */
export function hoverFocusHandlers(onEnter: () => void, onLeave: () => void) {
  return {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType !== "touch") onEnter();
    },
    onPointerLeave: (event: PointerEvent) => {
      if (event.pointerType !== "touch") onLeave();
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      if (event.currentTarget.matches(":focus-visible")) onEnter();
    },
    onBlur: onLeave,
  };
}
