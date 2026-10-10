const PATHS = {
  first: "M3.5 3v10M12 3.5 7.5 8l4.5 4.5",
  previous: "M10 3.5 5.5 8l4.5 4.5",
  next: "M6 3.5 10.5 8 6 12.5",
  last: "M12.5 3v10M4 3.5 8.5 8 4 12.5",
} as const;

/** The stroked chevrons for stepping through works: first, previous, next, last. */
export function StepIcon({ to }: { to: keyof typeof PATHS }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[to]} />
    </svg>
  );
}
