# home-0009 — Styling and wording review

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`home-0008`](home-0008-purposes-events-rail-founding.md), [`events-0003`](events-0003-timeline-label-styling.md) |
| **Source** | CEO (2026-10-10) |

## Goal

Inspect every section's typography, spacing, and wording on desktop and phone, and
fix what does not look finished. The gallery is out of scope here: it was reworked
in [`gallery-0004`](gallery-0004-new-works-progressive-many.md).

## Method

Section-by-section screenshots at 1440px and on a Pixel 7, with reduced motion so
scroll effects do not catch mid-animation; then the copy in `site.ts` read end to
end. The ten purposes are left word for word: they read as the society's registered
purposes.

## Findings and fixes

| Where | Finding | Fix |
|---|---|---|
| Event cards | "View details" moved about: beside the admission note on one card, under it on the next, depending on the note's length. | The note sits on its own line; "View details" is always the last thing in the card, at its bottom right. |
| Event cards | An event with no picture (the online talk) showed a large empty dark panel that read as a picture failing to load. | The frame names the event's place — "Online" — set large in the display face over faint coral rings, keeping the gradient. Decorative (`aria-hidden`); the card's own text carries it. |
| Events timeline | The "Today" badge printed over the month label beside it (OCT). | A tick within 3.5% of today (`TODAY_CLEARANCE`) hides its month and year labels; its tick mark stays. |
| About | "Registered non-profit … British Columbia" said three times within a screen: the hero's eyebrow, the first About paragraph, and the mission card's footnote. | The mission card's footnote now gives the society's registration as on its certificate: "BC Society No. S0085619 · Incorporated June 27, 2026". The footer keeps the registration note. |
| Events | The intro said "Follow the timeline" — phones have no timeline, only the date rail. | "Exhibitions, workshops, and gatherings through the year — choose any event for the full details." |

Checked and left as they are: the hero (type scale, contrast, buttons), the board
cards, the purposes accordion, Contact (the address line and the large email), the
footer, the header and tab bar.

## Regression guards

- unit:timeline — only the month under the Today badge stands aside.
- unit:EventsBrowser — a picture-less event names its place in the frame; "View
  details" is the last element of every card.
- unit:site — the registration detail matches the certificate.
- e2e › events polish — "View details" at the same bottom-right offset on every card
  (at rest); the picture-less frame shows "Online"; at 1024px and up no label is
  printed under the Today badge.
- `quality-0001`: E-lines added for each.
