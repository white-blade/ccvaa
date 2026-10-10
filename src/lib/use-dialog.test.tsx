import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDialog } from "@/lib/use-dialog";

function Dialog(props: { onClose: () => void; onNext?: () => void; onPrevious?: () => void }) {
  const { dialogRef, initialFocusRef } = useDialog({ open: true, ...props });
  return (
    <div ref={dialogRef} role="dialog" aria-label="Test">
      <button ref={initialFocusRef}>Close</button>
      <button>Other</button>
    </div>
  );
}

function swipe(element: Element, from: [number, number], to: [number, number]) {
  fireEvent.touchStart(element, { touches: [{ clientX: from[0], clientY: from[1] }] });
  fireEvent.touchEnd(element, { changedTouches: [{ clientX: to[0], clientY: to[1] }] });
}

function renderDialog() {
  const handlers = { onClose: vi.fn(), onNext: vi.fn(), onPrevious: vi.fn() };
  render(<Dialog {...handlers} />);
  return { ...handlers, dialog: screen.getByRole("dialog") };
}

describe("useDialog", () => {
  it("swipes left for next and right for previous", () => {
    const { dialog, onNext, onPrevious } = renderDialog();
    swipe(dialog, [300, 200], [120, 210]);
    expect(onNext).toHaveBeenCalledTimes(1);
    swipe(dialog, [100, 200], [280, 190]);
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("ignores short or mostly vertical swipes", () => {
    const { dialog, onNext, onPrevious } = renderDialog();
    swipe(dialog, [200, 200], [170, 200]); // too short
    swipe(dialog, [200, 100], [130, 400]); // a scroll, not a swipe
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("ignores two-finger gestures, leaving pinch-zoom alone", () => {
    const { dialog, onNext } = renderDialog();
    fireEvent.touchStart(dialog, {
      touches: [
        { clientX: 300, clientY: 200 },
        { clientX: 320, clientY: 260 },
      ],
    });
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 100, clientY: 200 }] });
    expect(onNext).not.toHaveBeenCalled();
  });

  it("locks page scroll while open and restores it after", () => {
    document.body.style.overflow = "auto";
    const { unmount } = render(<Dialog onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("focuses the initial control on open", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("dismisses on a clear downward swipe when asked to, and only then", () => {
    const onSwipeDown = vi.fn();
    const onClose = vi.fn();
    render(<SwipeDownDialog onClose={onClose} onSwipeDown={onSwipeDown} />);
    const dialog = screen.getByRole("dialog", { name: "Swipe" });
    swipe(dialog, [200, 100], [210, 300]);
    expect(onSwipeDown).toHaveBeenCalledTimes(1);
    swipe(dialog, [200, 100], [380, 220]); // more sideways than down
    expect(onSwipeDown).toHaveBeenCalledTimes(1);
  });
});

function SwipeDownDialog(props: { onClose: () => void; onSwipeDown: () => void }) {
  const { dialogRef } = useDialog({ open: true, ...props });
  return <div ref={dialogRef} role="dialog" aria-label="Swipe" />;
}
