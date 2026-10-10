# events-0003 — Timeline labels: a year column and a monospace month column

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`events-0002`](events-0002-events-page.md), [`home-0008`](home-0008-purposes-events-rail-founding.md) |
| **Source** | CEO (2026-10-09) |

## Goal

The side timeline (≥ 1024px, beside the listings) labels each month to the left of
its line, with the year stacked under the first month and every January. Three
requests:

1. Highlight the year: clearly more prominent than the months.
2. Months in a monospaced treatment, so every label is the same width and they line
   up in a column ("MAY" and "NOV" occupy the same box, edges aligned).
3. Years line up in their own consistent column too.

The dots, previews, hover, tap, and arrow keys do not change, nor does the date rail
below `lg`.

## Design decisions

- **Two columns, one row per tick.** Each tick is one line: a year cell, then a
  month cell, right against the line. The year no longer stacks under its month, so
  a labelled tick is no taller than the others and stays centred on its date.
- **Fixed widths in `ch`, monospace font.** The tick row uses `font-mono` (the
  system monospace stack). The month cell is `w-[3ch]` and the year cell `w-[4ch]`,
  each measured in its own font, so the boxes are identical on every row whatever
  the letters; monospace glyphs make the inked text equal too. Labels stay the
  three-letter abbreviations from `timeline.ts`, set in capitals by CSS
  (`uppercase`), and the year uses `tabular-nums`.
- **The year cell is always rendered**, empty on ticks without a year, so the month
  column never shifts sideways.
- **Year emphasis:** bold, a step larger (11px vs 10px), in `coral-dark` — the
  brand accent that still passes 4.5:1 for small text on the cream background.
  Months stay `ocean-500`, medium weight. A year's tick mark on the line is longer
  and coral, so the turn of the year reads on the line itself.
- **Room for the column:** the line moves from 4rem to 4.5rem from the left
  (`left-18`). The preview card (left offset 1.5rem, 14rem wide) then ends exactly
  at the aside's 20rem edge, so nothing overflows.
- No change to `timeline.ts` logic: which ticks carry a year (the first and every
  January) is unchanged.

## Regression guards

`quality-0001`: L8b added.

- unit:timeline › every month label is three letters and every year four digits,
  so the fixed `ch` widths always fit.
- unit:EventsBrowser › month and year cells: one each per tick, the year cell empty
  where there is no year; months `w-[3ch]`, `uppercase`, `ocean-500` in a
  `font-mono` row; years `w-[4ch]`, bold, `coral-dark`.
- e2e › device layouts › lg and up: timeline months and years each line up…: on
  every device ≥ 1024px, month cells share one width and left edge (within 1px),
  as do year cells; the year column sits left of the month column; years differ
  from months in computed weight and colour; the months' inked text widths are
  equal (monospace).
- Contrast is covered by the existing full-page axe run (A1).
