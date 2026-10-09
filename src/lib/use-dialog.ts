import { useEffect, useRef, type RefObject } from "react";

type UseDialogOptions = {
  open: boolean;
  onClose: () => void;
  /** Supplied by consumers that step through a collection (the gallery lightbox). */
  onNext?: () => void;
  onPrevious?: () => void;
};

type UseDialogResult = {
  /** Put on the dialog container — scopes the focus trap. */
  dialogRef: RefObject<HTMLDivElement | null>;
  /** Put on the element that should receive focus when the dialog opens. */
  initialFocusRef: RefObject<HTMLButtonElement | null>;
};

/**
 * Modal dialog behaviour shared by the gallery lightbox and the events dialog:
 * Escape to close, optional arrow-key navigation, Tab trapped inside, and the
 * page behind locked from scrolling.
 *
 * Focus is moved to `initialFocusRef` on open. Restoring focus to whatever opened
 * the dialog stays with the caller, which knows which element that was.
 */
export function useDialog({
  open,
  onClose,
  onNext,
  onPrevious,
}: UseDialogOptions): UseDialogResult {
  const dialogRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    initialFocusRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowRight" && onNext) {
        onNext();
        return;
      }
      if (event.key === "ArrowLeft" && onPrevious) {
        onPrevious();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href]",
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, onNext, onPrevious]);

  return { dialogRef, initialFocusRef };
}
