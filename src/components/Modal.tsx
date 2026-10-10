"use client";

import { useRef, type ReactNode, type RefObject, type TouchEvent } from "react";
import { createPortal } from "react-dom";

import { useDialog } from "@/lib/use-dialog";

type ModalProps = {
  /** Id of the element that names the dialog — usually its heading. */
  labelledBy: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  /** Width cap for the panel, e.g. `max-w-3xl`. */
  widthClass?: string;
  /** Given the ref for the control that should take focus on open — the close button. */
  children: (initialFocusRef: RefObject<HTMLButtonElement | null>) => ReactNode;
};

/** How far down the handle must be dragged to dismiss the sheet. */
const DISMISS_DRAG_PX = 60;

/**
 * The shared dialog shell: dimmed backdrop, centred white panel capped to the
 * viewport and scrolled inside, with the keyboard behaviour from `useDialog`.
 * A click on the backdrop closes; clicks inside the panel do not.
 *
 * Portalled to <body>: every section is its own stacking context (`isolate`), so a
 * dialog rendered inside one could never rise above the fixed header.
 *
 * On phones (below `sm`) it is a bottom sheet instead: full width, rising from the
 * bottom edge, with a handle that a downward swipe dismisses. Only the handle strip
 * listens, so scrolling the sheet's content never closes it.
 */
export function Modal({
  labelledBy,
  onClose,
  onNext,
  onPrevious,
  widthClass = "max-w-3xl",
  children,
}: ModalProps) {
  const { dialogRef, initialFocusRef } = useDialog({
    open: true,
    onClose,
    onNext,
    onPrevious,
  });
  const dragStartY = useRef<number | null>(null);

  const onHandleTouchStart = (event: TouchEvent) => {
    dragStartY.current =
      event.touches.length === 1 ? event.touches[0].clientY : null;
  };
  const onHandleTouchEnd = (event: TouchEvent) => {
    if (dragStartY.current === null) return;
    const dy = event.changedTouches[0].clientY - dragStartY.current;
    dragStartY.current = null;
    if (dy > DISMISS_DRAG_PX) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto overscroll-contain bg-ocean-950/70 backdrop-blur-sm sm:items-center sm:p-8"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl ring-1 ring-ocean-100 motion-safe:animate-sheet-in sm:my-auto sm:max-h-[90dvh] sm:rounded-3xl sm:pb-0 sm:motion-safe:animate-rise-in ${widthClass}`}
      >
        {/* Phones: the sheet's handle. Decorative to assistive technology — the
            close button and Escape do the same job. */}
        <div
          aria-hidden="true"
          data-sheet-handle=""
          onTouchStart={onHandleTouchStart}
          onTouchEnd={onHandleTouchEnd}
          className="flex shrink-0 touch-none justify-center pb-2 pt-3 sm:hidden"
        >
          <span className="h-1.5 w-12 rounded-full bg-ocean-200" />
        </div>
        {children(initialFocusRef)}
      </div>
    </div>,
    document.body,
  );
}

/** The round ✕ used in every dialog's corner. */
export const closeButtonClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-ocean-950/40 text-cream backdrop-blur-sm transition-colors hover:bg-ocean-950/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral";
