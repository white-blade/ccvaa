# home-0005 — Purposes accordion, moving between sections, board portrait frame

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`home-0003`](home-0003-device-optimized.md), [`home-0004`](home-0004-board-photos-bios.md) |
| **Source** | CEO (2026-10-09) |

## Goal

1. A friendlier way to read Our Purposes.
2. A better experience switching between sections.
3. Zhong Liu's profile photo at the same scale as the others.
4. Confirm the page is still responsive and touch-friendly on every device size, and
   write down a checklist so later changes cannot quietly regress it —
   [`quality-0001`](quality-0001-regression-checklist.md).

## 1. Our Purposes as an accordion

**Was**: one "Read all" toggle that opened all ten descriptions at once; the
purposes themselves were not interactive.

**Now** (`PurposesSection`):

- Each purpose is a full-width button (number, title, chevron) that opens and closes
  its own description. Several can be open at once.
- "Expand all" / "Collapse all" beside the heading, labelled for what it will do
  next; it reads "Collapse all" only once every purpose is open.
- Height animates (grid rows `0fr → 1fr`); `motion-reduce` turns the animation off.
- A closed description is `inert`: Tab and screen readers skip it. Each button has
  `aria-expanded` and `aria-controls`; each open panel is a region named by its
  purpose.
- Cards are separate (`items-start`) so opening one does not stretch its neighbour.
- `Disclosure` had no other user and is removed; the subsection heading classes moved
  to `components/subsection.ts`.

## 2. Moving between sections

A review of section-to-section navigation found five rough edges:

| Problem | Fix |
|---------|-----|
| During a glide the nav lit up every section passed (About → Gallery → Events → Contact) | `scrollToSection` announces `ccvaa:section-glide` start/settle; `useActiveSection` holds the **destination** for the whole trip |
| Contact, short and last, could never cross the middle of a tall screen — so on a portrait iPad the nav still said "Events" after clicking Contact | At the end of the page the **last section** counts |
| On a tall screen the hero is under half the viewport, so About was "being read" — and the URL rewritten to `#about` — before the visitor scrolled at all | At the very **top**, nothing counts |
| Back/Forward snapped instantly between section entries | Back/Forward **glide** (`popstate` → `scrollToSection(…, { history: "none" })`, `scrollRestoration = "manual"`) |
| The URL changed only on a click, so after scrolling a shared link or reload went to the wrong place | The **address follows the section being read** (`replaceState`, never `pushState`; the bare URL over the hero) |

Also: a **Back to top** button appears once the hero is a screen behind. It shows
only from `xl` (1280px): narrower, a floating button sat on top of content — at 768px
it covered purpose 08's toggle — and phones and tablets already have the tab bar and
the wordmark. `#top` now leaves a bare URL rather than `#top`.

## 3. Board portrait frame

The profile's photo column stretched to the dialog's height, and the photo filled
it. Zhong Liu's four-paragraph bio made the dialog tall, so his square portrait was
scaled up until his face filled a tall narrow column. The photo now has a fixed 4:5
frame (4:3 on phones) at the top of the column, whatever the bio's length; all three
portraits render at the same size, and a browser test holds them to it.

## 4. Device check

After all of the above, the browser suite was run on all six devices (Chromium
desktop, touch tablet, touch phone; WebKit iPhone, iPad, portrait iPad) and
screenshots reviewed at 320 and 768px. That review is what found the back-to-top
overlap. Results: 151 unit tests and 149 browser runs pass; no sideways overflow from
320 to 1920px; axe clean, contrast included.
