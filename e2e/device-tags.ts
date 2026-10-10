/**
 * Tags for tests that only make sense on some devices, decided by what the device is
 * — touch, and how wide — never by its name, so a new device in playwright.config.ts
 * needs no changes here. The config gives each project a `grepInvert` of the tags
 * that do not fit it, so those tests never start: no page load thrown away on a
 * skip, and CI shards split only the tests that run.
 */
export type Device = { width: number; touch: boolean };

export const deviceTags = {
  "@touch": (d: Device) => d.touch,
  "@no-touch": (d: Device) => !d.touch,
  /** Below `md` the section links move to the bottom tab bar. */
  "@phone": (d: Device) => d.width < 768,
  "@md": (d: Device) => d.width >= 768,
  /** Below `sm` dialogs are bottom sheets. */
  "@below-sm": (d: Device) => d.width < 640,
  "@sm": (d: Device) => d.width >= 640,
  /** The events timeline shows from `lg`; below it, the date rail. */
  "@lg": (d: Device) => d.width >= 1024,
  "@below-lg": (d: Device) => d.width < 1024,
  /** Back to top shows from `xl`. */
  "@xl": (d: Device) => d.width >= 1280,
  "@below-xl": (d: Device) => d.width < 1280,
  /** Tests that set their own viewport: one device, a mouse-driven desktop, is enough. */
  "@desktop": (d: Device) => !d.touch && d.width >= 1280,
};

export type DeviceTag = keyof typeof deviceTags;

/** Matches every test tagged for some other kind of device; undefined if none. */
export function tagsNotFor(device: Device): RegExp | undefined {
  const misfits = Object.entries(deviceTags)
    .filter(([, fits]) => !fits(device))
    .map(([tag]) => tag);
  return misfits.length ? new RegExp(`(?:${misfits.join("|")})(?=\\s|$)`) : undefined;
}
