import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { hoverFocusHandlers } from "@/lib/hover-focus";

function setup() {
  const onEnter = vi.fn();
  const onLeave = vi.fn();
  render(<button {...hoverFocusHandlers(onEnter, onLeave)}>Target</button>);
  return { onEnter, onLeave, button: screen.getByRole("button") };
}

describe("hoverFocusHandlers", () => {
  it("responds to a mouse entering and leaving", () => {
    const { onEnter, onLeave, button } = setup();
    fireEvent.pointerEnter(button, { pointerType: "mouse" });
    expect(onEnter).toHaveBeenCalledTimes(1);
    fireEvent.pointerLeave(button, { pointerType: "mouse" });
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("ignores touch, so a tap cannot strand a highlight", () => {
    const { onEnter, button } = setup();
    fireEvent.pointerEnter(button, { pointerType: "touch" });
    expect(onEnter).not.toHaveBeenCalled();
  });

  it("counts pen like a mouse", () => {
    const { onEnter, button } = setup();
    fireEvent.pointerEnter(button, { pointerType: "pen" });
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("enters on keyboard focus only, and always leaves on blur", () => {
    const { onEnter, onLeave, button } = setup();
    const matches = vi.spyOn(button, "matches");

    matches.mockReturnValue(false); // focus from a tap or click
    fireEvent.focus(button);
    expect(onEnter).not.toHaveBeenCalled();

    matches.mockReturnValue(true); // focus from the keyboard
    fireEvent.focus(button);
    expect(onEnter).toHaveBeenCalledTimes(1);

    fireEvent.blur(button);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});
