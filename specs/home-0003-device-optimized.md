# home-0003 — Optimized for phones and tablets, not just shrunk

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `done` — merged |
| **Depends on** | [`home-0002`](home-0002-polish-accessibility-touch.md) |
| **Source** | CEO (2026-10-09) |

## Goal

An optimized version for device types that are not desktop. `home-0002` made the page
*work* on touch; this makes phones and tablets feel designed for — thumb reach,
native-feeling sheets, a timeline that exists below desktop width, and the physical
edges of the device (notches, home indicators, browser chrome).

## How devices are told apart

**CSS media features, never user-agent sniffing.** The export is static HTML served
to everyone, so there is no server to sniff with, and a UA string says nothing
reliable about a screen anyway. Layout follows width; input follows `pointer`:

| Class | Test | Gets |
|-------|------|------|
| Phone | width < 768 (`< md`) | bottom tab bar, bottom-sheet dialogs (< 640), date rail, fixed 2-column gallery |
| Tablet, portrait | 768 – 1023 (`md`–`lg`) | top nav, date rail |
| Tablet, landscape / desktop | ≥ 1024 (`lg`) | top nav, side timeline |
| Any touch screen | `pointer: coarse` | press feedback, labels without hover (from `home-0002`) |

An iPad in landscape is laid out like a desktop and driven like a phone; the two
axes are independent on purpose.

## Changes

### 1. Bottom tab bar on phones

The hamburger menu goes. Below `md`, a fixed bar along the bottom carries the four
sections as icon + label tabs, with the section on screen marked (`aria-current`).

- **Why**: the top corner is the hardest place to reach one-handed; a bottom bar is
  one tap, always visible, and shows where you are — the menu was two taps and hid
  that.
- It clears the home indicator (`env(safe-area-inset-bottom)`), and the footer pads
  its bottom by the bar's height so nothing ends up behind it.
- Taps go through the same `scrollToSection` glide as every other in-page link.
- The header on phones is the wordmark and the reading-progress line only.

### 2. Bottom-sheet dialogs on phones

Below `sm` (640), the event and board dialogs rise from the bottom edge as sheets:
full width, rounded top corners, a drag handle, up to 92% of the dynamic viewport.

- **Swipe down on the handle area to dismiss**, as native sheets do. Only the top
  strip listens, so scrolling the sheet's content never closes it.
- From `sm` up they stay centred dialogs.
- The photo viewer stays full-screen; a sheet is the wrong shape for a photograph.

### 3. Date rail below `lg`

The side timeline needs ~20rem beside the list, so below `lg` it was hidden and
phones and portrait tablets lost it entirely. They now get a **date rail**: a sticky,
horizontally scrolling strip of date chips (month, day, short title) pinned under
the header above the listings.

- Tap a chip → the page glides to that event's card, which lands just below the rail.
- As the visitor scrolls the list, the chip for the card being read is marked and the
  rail scrolls it into view, so the rail is a live index of where you are.
- Chips snap (`scroll-snap`), scroll on their own without moving the page, and are
  ≥ 40 px tall.
- Search dims the chips of hidden events, as on the timeline.
- From `lg` the side timeline returns and the rail is not rendered.

`scrollToSection` gains a sibling, `glideTo(element, offset)`, so sections and cards
share one easing, cancellation, and reduced-motion path.

### 4. Gallery on phones

Phones always show two columns (the lead photograph full-width above), so the
per-row control did nothing there. It is hidden below `sm`; the count stays.

### 5. Touch feel

- Press feedback: cards, tiles, chips, and tabs scale down slightly while pressed
  (`pointer-coarse:active:`), since touch has no hover to confirm a target.
- The grey iOS tap flash is turned off (`-webkit-tap-highlight-color`) — the press
  feedback replaces it, and the focus ring still marks keyboard focus.
- Event summaries clamp to three lines on phones, so a card fits a screen.

### 6. Device edges

- `viewport-fit=cover`, so the page can use the full screen on notched phones —
  with the header, tab bar, and footer padded by the matching `env(safe-area-inset-*)`
  so nothing sits under a notch or the home indicator.
- `theme-color` tints the mobile browser's chrome the page's dark ink — what sits at
  both ends of the page, the hero and the footer. (The site has no dark mode, so one
  colour.)

## Found along the way

**The sticky side timeline had stopped sticking.** `home-0002` gave every section
`overflow-hidden` to clip its colour blooms. `overflow: hidden` makes an element a
scroll container, and `position: sticky` sticks relative to the nearest one — so the
timeline (and, at first, the new date rail) scrolled away with the page. No test
looked. Sections now use `overflow: clip`, which clips the same way without creating
a scroll container. The browser suite now checks that both stay pinned while the
listings scroll, and fails on all six devices if `overflow-hidden` comes back.

## Not changed

- No separate mobile site or `m.` route: one page, one URL, adapting in CSS.
- No user-agent checks (see above).

## Tests

- **Unit**: the tab bar (links, icons named, current section), the date rail (a chip
  per event in order, current chip, selecting glides to the card), `glideTo`, and
  sheet swipe-to-dismiss (handle only; content swipes ignored).
- **Browser**: WebKit — Safari's engine, which every iPhone and iPad browser uses —
  joins Chromium, with an iPhone, a landscape iPad, and a portrait iPad (834 × 1194),
  so each device class has a project; six devices in all, run in parallel locally and
  in CI. Device rules are read from each
  project's width and touch, not its name:
  - phones: the tab bar shows and navigates, there is no menu button, the end of the
    page is not hidden behind the bar, dialogs are sheets that a downward swipe
    closes, the gallery has no per-row control;
  - below `lg`: the date rail shows, a chip glides its card into view below the rail;
  - from `lg`: no rail, side timeline present;
  - the side timeline and the date rail stay pinned while the listings scroll;
  - everywhere: no sideways overflow and no axe violations, as before.

The date-rail chips first carried an `aria-label` that differed from their visible
text, which axe flagged on WebKit; their name is now the visible title followed by
the full date as screen-reader text.
