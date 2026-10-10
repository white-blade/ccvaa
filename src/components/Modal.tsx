"use client";

import type { ReactNode, RefObject } from "react";
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

/**
 * The shared dialog shell: dimmed backdrop, centred white panel capped to the
 * viewport and scrolled inside, with the keyboard behaviour from `useDialog`.
 * A click on the backdrop closes; clicks inside the panel do not.
 *
 * Portalled to <body>: every section is its own stacking context (`isolate`), so a
 * dialog rendered inside one could never rise above the fixed header.
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-ocean-950/70 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className={`my-auto flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-ocean-100 motion-safe:animate-rise-in ${widthClass}`}
      >
        {children(initialFocusRef)}
      </div>
    </div>,
    document.body,
  );
}

/** The round ✕ used in every dialog's corner. */
export const closeButtonClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-ocean-950/40 text-cream backdrop-blur-sm transition-colors hover:bg-ocean-950/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral";
