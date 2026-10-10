import { useCallback, useSyncExternalStore } from "react";

import { SECTION_GLIDE_EVENT, type SectionGlideDetail } from "@/lib/scroll-to-section";

/** Not scrolled at all: the visitor is looking at the hero, whatever else fits. */
function atPageTop(): boolean {
  return window.scrollY < 1;
}

function atPageEnd(): boolean {
  return (
    window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
  );
}

type Store = {
  value: string | null;
  listeners: Set<() => void>;
  stop: (() => void) | null;
};

const stores = new Map<string, Store>();

function storeFor(key: string): Store {
  let store = stores.get(key);
  if (!store) {
    store = { value: null, listeners: new Set(), stop: null };
    stores.set(key, store);
  }
  return store;
}

/** First subscriber starts the observers for `key`; the last one stops them. */
function subscribeTo(key: string, onChange: () => void): () => void {
  const store = storeFor(key);
  store.listeners.add(onChange);
  if (store.listeners.size === 1) store.stop = start(store, key.split(" "));
  return () => {
    store.listeners.delete(onChange);
    if (store.listeners.size === 0) {
      store.stop?.();
      store.stop = null;
    }
  };
}

/** Wires the observers for one set of ids; returns the teardown. */
function start(store: Store, ids: string[]): () => void {
  let active: string | null = null;
  // undefined: not gliding. null: gliding to the top.
  let glideTarget: string | null | undefined = undefined;

  const publish = () => {
    const value =
      glideTarget !== undefined && (glideTarget === null || ids.includes(glideTarget))
        ? glideTarget
        : active;
    if (value === store.value) return;
    store.value = value;
    store.listeners.forEach((listener) => listener());
  };
  const setActive = (next: string | null) => {
    active = next;
    publish();
  };

  const onGlide = (event: Event) => {
    const { target, gliding } = (event as CustomEvent<SectionGlideDetail>).detail;
    glideTarget = gliding ? target : undefined;
    publish();
  };
  window.addEventListener(SECTION_GLIDE_EVENT, onGlide);

  const last = ids[ids.length - 1];
  const sections = ids
    .map((id) => document.getElementById(id))
    .filter((section): section is HTMLElement => section !== null);

  const observer =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              setActive(atPageTop() ? null : atPageEnd() ? last : entry.target.id);
            }
          },
          { rootMargin: "-45% 0px -50% 0px" },
        );
  sections.forEach((section) => observer?.observe(section));

  const first = sections[0];
  const onScroll = () => {
    if (atPageEnd()) {
      setActive(last);
    } else if (
      atPageTop() ||
      (first && first.getBoundingClientRect().top > window.innerHeight / 2)
    ) {
      // Leaving the first section upward means the hero is back on screen.
      setActive(null);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  // The page can grow after the scroll stops (images loading below): re-check
  // the end-of-page and top rules whenever its size changes, not only on scroll.
  const resizes =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => onScroll());
  resizes?.observe(document.body);

  return () => {
    observer?.disconnect();
    resizes?.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener(SECTION_GLIDE_EVENT, onGlide);
    store.value = null;
  };
}

/**
 * The id of the section being read, for marking the matching nav link: whichever
 * crosses the middle of the viewport. `null` over the hero and before hydration.
 *
 * Three corrections to that rule:
 * - At the very top nothing counts. On a tall screen the hero is shorter than half
 *   the viewport, so About would otherwise be "read" — and the address changed to
 *   #about — before the visitor had scrolled at all.
 * - At the end of the page the last section counts, even when it is too short to
 *   ever reach the middle of a tall screen (Contact, on a portrait tablet).
 * - During a section glide the destination counts for the whole trip, so the nav
 *   does not flicker through every section passed on the way.
 *
 * The header, the tab bar, and SectionLinks all ask, so the answer is one shared
 * store per set of ids: the observers and listeners start with the first subscriber
 * and stop with the last, instead of running once per caller.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const key = ids.join(" ");
  const subscribe = useCallback((onChange: () => void) => subscribeTo(key, onChange), [key]);
  return useSyncExternalStore(
    subscribe,
    () => storeFor(key).value,
    () => null,
  );
}
