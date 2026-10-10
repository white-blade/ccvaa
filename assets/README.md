# Source assets (not deployed)

Originals kept for regenerating web assets. Nothing here is served — it sits outside
`public/`, so the static export ignores it.

- `hero-background-original.jpg` — full-resolution source for `public/images/hero-background.webp`

Gallery originals are **not** kept here: they run to megabytes each and would bloat
every clone. Keep them in the association's archive (e.g. the shared Drive) and
regenerate the web sizes with `npm run photos -- <folder>` — see the README.
