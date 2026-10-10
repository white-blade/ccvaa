# home-0004 — Board photographs and bios

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`home-0002`](home-0002-polish-accessibility-touch.md) (board profiles) |
| **Source** | CEO (2026-10-09) — photographs and `Bios.docx` supplied |

## Goal

Replace the board placeholders from `home-0002` — monogram portraits, a logo in place
of the group photograph, lorem ipsum bios — with the supplied photographs and bios.

## Content

| Member | Portrait | Bio |
|--------|----------|-----|
| Zhong Liu, President | ✓ | ✓ four paragraphs, plus website (liuzhongphoto.com) |
| Yaqi Jing, Vice President | ✓ | ✓ one paragraph |
| Albert Zang, Secretary | ✓ | **not yet written** — the source reads "TODO…" |

- Bios are taken verbatim from `Bios.docx`. Nothing was written on anyone's behalf:
  Albert Zang's profile says "Bio coming soon." until a bio arrives. An empty `bio`
  shows `boardContent.bioPlaceholder`; a content test fails if lorem ipsum or "TODO"
  ever reaches a bio.
- The website is linked over `https`, opens in a new tab with `rel="noopener
  noreferrer"`, and says so to screen readers. The source gave it without a scheme;
  `https://www.liuzhongphoto.com` is assumed.
- The group photograph's description names the board **left to right** (Yaqi Jing,
  Zhong Liu, Albert Zang), matched against the individual portraits; the old
  placeholder text listed them in another order.

## Policy: no personal email addresses

Decided 2026-10-09 (CEO): **no personal email address is ever added anywhere on the
page** — not in bios, profiles, or any future content. The organization's
`info@ccvaa.ca` is the only address shown, and board members are reached through it.
A member's own public website may be linked. Enforced by tests on the content and on
the built page; recorded in `CLAUDE.md` and
[`quality-0001`](quality-0001-regression-checklist.md) (C5).

At the time of the decision no personal address was on the site — `Bios.docx` held
none — so nothing needed removing.

## Images

Originals ranged up to 3740 × 5722 and 11 MB. Pages serves exactly what is committed
(`images.unoptimized`), so each was resized and recompressed with `sips` to the
README's budget before committing:

| File | Size | Pixels |
|------|------|--------|
| `public/board/board.jpg` | 260 KB | 1600 × 1157 |
| `public/board/zhong-liu.jpg` | 139 KB | 1200 × 1128 |
| `public/board/yaqi-jing.jpg` | 251 KB | 1200 × 1158 |
| `public/board/albert-zang.jpg` | 173 KB | 784 × 1200 |

None carried location or camera metadata. A content test checks that every file
`site.ts` names exists and stays within 300 KB.

## Presentation

- The group photograph replaces the logo placeholder, cropped to keep faces in frame
  (`object-position` 50% 30%) at 4:3 on phones and 16:9 from `sm`.
- Each board card shows the member's photograph in its round avatar (decorative —
  the name is beside it); the monogram remains the fallback for a member without a
  portrait.
- Profiles crop portraits around the face (50% 25%), so the square and the tall
  portrait both frame well on the desktop column and the phone sheet.
