import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "@/components/Modal";

function renderModal() {
  const onClose = vi.fn();
  render(
    <Modal labelledBy="title" onClose={onClose}>
      {(initialFocusRef) => (
        <div data-testid="content">
          <h2 id="title">Sheet</h2>
          <button ref={initialFocusRef}>Close</button>
        </div>
      )}
    </Modal>,
  );
  return { onClose, handle: document.querySelector<HTMLElement>("[data-sheet-handle]")! };
}

function drag(element: Element, fromY: number, toY: number) {
  fireEvent.touchStart(element, { touches: [{ clientX: 100, clientY: fromY }] });
  fireEvent.touchEnd(element, { changedTouches: [{ clientX: 100, clientY: toY }] });
}

describe("Modal as a bottom sheet", () => {
  it("dismisses when the handle is dragged down", () => {
    const { onClose, handle } = renderModal();
    drag(handle, 100, 220);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open for a short or upward drag on the handle", () => {
    const { onClose, handle } = renderModal();
    drag(handle, 100, 140);
    drag(handle, 300, 100);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores downward drags on the content, which are scrolling", () => {
    const { onClose } = renderModal();
    drag(screen.getByTestId("content"), 100, 400);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("hides the handle from assistive technology and from sm up", () => {
    const { handle } = renderModal();
    expect(handle).toHaveAttribute("aria-hidden", "true");
    expect(handle).toHaveClass("sm:hidden");
  });

  it("rises from the bottom on phones and centres from sm up", () => {
    renderModal();
    const dialog = screen.getByRole("dialog", { name: "Sheet" });
    expect(dialog).toHaveClass("rounded-t-3xl", "sm:rounded-3xl");
    expect(dialog.parentElement).toHaveClass("items-end", "sm:items-center");
  });
});
