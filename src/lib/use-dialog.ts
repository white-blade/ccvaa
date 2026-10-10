import { useEffect, useRef, type RefObject } from "react";

type UseDialogOptions = {
  open: boolean;
  onClose: () => void;
  /** Supplied by consumers that step through a collection (the gallery lightbox). */
  onNext?: () => void;
  onPrevious?: () => void;
  /** A clear downward swipe on touch — the photo viewer's way out, as in photo apps. */
  onSwipeDown?: () => void;
};

type UseDialogResult = {
  /** Put on the dialog container — scopes the focus trap. */
  dialogRef: RefObject<HTMLDivElement | null>;
  /** Put on the element that should receive focus when the dialog opens. */
  initialFocusRef: RefObject<HTMLButtonElement | null>;
};

/**
 * Modal dialog behaviour shared by every dialog: Escape to close, optional
 * arrow-key and swipe navigation, Tab trapped inside, and the page behind locked
 * from scrolling.
 *
 * Focus moves to `initialFocusRef` on open and returns, on close, to whatever had
 * it before — the card, tile, or dot that opened the dialog.
 */
export function useDialog({
  open,
  onClose,
  onNext,
  onPrevious,
  onSwipeDown,
}: UseDialogOptions): UseDialogResult {
  const dialogRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  // Keyed on `open` alone, and declared first: it must capture the opener before
  // the effect below moves focus, and must not re-run when a callback changes.
  useEffect(() => {
    if (!open) return;
    const opener =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => opener?.focus();
  }, [open]);

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

  // Swipe left/right steps through a collection on touch screens, and down dismisses
  // where the dialog asks for it. A swipe must clearly favour one axis, so diagonal
  // drags, scrolling, and pinch-zoom are left alone.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog || (!onNext && !onPrevious && !onSwipeDown)) return;

    let start: { x: number; y: number } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      start =
        event.touches.length === 1
          ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
          : null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;
      if (dy > 80 && dy > Math.abs(dx) * 1.5) {
        onSwipeDown?.();
        return;
      }
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      (dx < 0 ? onNext : onPrevious)?.();
    };

    dialog.addEventListener("touchstart", onTouchStart, { passive: true });
    dialog.addEventListener("touchend", onTouchEnd);
    return () => {
      dialog.removeEventListener("touchstart", onTouchStart);
      dialog.removeEventListener("touchend", onTouchEnd);
    };
  }, [open, onNext, onPrevious, onSwipeDown]);

  return { dialogRef, initialFocusRef };
}
