"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger siblings by giving each a later start, in milliseconds. */
  delay?: number;
};

/**
 * Fades its content up as it scrolls into view. The hidden starting state lives in
 * globals.css behind `html.js` and reduced-motion checks; this only flips the
 * element to revealed, once, the first time it is seen.
 */
export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      element.classList.add("is-revealed");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-revealed");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);

    // Keyboard focus can land inside before the scroll does; never focus the unseen.
    const reveal = () => element.classList.add("is-revealed");
    element.addEventListener("focusin", reveal);

    return () => {
      observer.disconnect();
      element.removeEventListener("focusin", reveal);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-reveal=""
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
