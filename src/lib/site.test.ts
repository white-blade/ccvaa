// @vitest-environment node
import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import * as events from "@/lib/events";
import * as site from "@/lib/site";
import { boardContent, organization } from "@/lib/site";

/** Checks the board content itself, so a bad edit fails here, not on the live site. */
const boardDir = path.join(process.cwd(), "public", "board");
const photos = [
  boardContent.photo,
  ...boardContent.members.flatMap((member) => (member.portrait ? [member.portrait] : [])),
];

describe("boardContent", () => {
  it("points every photograph at a file in public/board", () => {
    for (const photo of photos) {
      expect(existsSync(path.join(boardDir, photo)), photo).toBe(true);
    }
  });

  it("keeps every photograph within the README's size budget (≤300KB)", () => {
    for (const photo of photos) {
      expect(statSync(path.join(boardDir, photo)).size, photo).toBeLessThanOrEqual(300 * 1024);
    }
  });

  it("describes every photograph", () => {
    expect(boardContent.photoAlt.trim()).not.toBe("");
    for (const member of boardContent.members) {
      expect(member.portraitAlt.trim(), member.name).not.toBe("");
    }
  });

  it("has a bio for every board member", () => {
    for (const member of boardContent.members) {
      expect(member.bio.length, member.name).toBeGreaterThan(0);
    }
  });

  it("has no placeholder filler left in the bios", () => {
    for (const member of boardContent.members) {
      for (const paragraph of member.bio) {
        expect(paragraph, member.name).not.toMatch(/lorem ipsum|TODO/i);
      }
    }
  });

  it("links websites over https", () => {
    for (const member of boardContent.members) {
      if (member.website) expect(member.website.href, member.name).toMatch(/^https:\/\//);
    }
  });
});

describe("email policy", () => {
  const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

  it("shows no email address but the organization's — never a personal one", () => {
    // Every piece of content the page renders: site copy and config, and listings.
    const content = JSON.stringify({ site, listings: events.getEvents() });
    const found = new Set(content.match(EMAIL) ?? []);
    expect([...found]).toEqual([organization.email]);
  });

  it("gives the society's registration as on its certificate", () => {
    expect(organization.registrationDetail).toBe("BC Society No. S0085619 · Incorporated June 27, 2026");
  });
});
