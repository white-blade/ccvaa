"use client";

type ColumnControlProps<T extends number> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  /** Prefix for the label's id. */
  id: string;
};

/**
 * "How many per row" — a segmented control, styled for the gallery's dark band. Buttons rather than a select, so the
 * whole range is one tap away, with `aria-pressed` carrying the current choice.
 */
export function ColumnControl<T extends number>({
  label,
  options,
  value,
  onChange,
  id,
}: ColumnControlProps<T>) {
  const labelId = `${id}-label`;

  return (
    <div className="flex shrink-0 items-center gap-3">
      <span
        id={labelId}
        className="text-xs font-medium uppercase tracking-wider text-ocean-200"
      >
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1"
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`h-8 w-8 rounded-full text-sm pointer-coarse:h-10 pointer-coarse:w-10 font-semibold lining-nums tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
              value === option
                ? "bg-cream text-ocean-900"
                : "text-ocean-100 hover:bg-white/10"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
