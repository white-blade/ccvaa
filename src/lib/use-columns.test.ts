import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createColumnStore } from "@/lib/use-columns";

const KEY = "ccvaa:test-columns";
const OPTIONS = [2, 3, 4] as const;

// A fresh store per test: each keeps an in-memory mirror once read.
function makeStore() {
  return createColumnStore<(typeof OPTIONS)[number]>(KEY, OPTIONS, 3);
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createColumnStore", () => {
  it("falls back when nothing is stored", () => {
    expect(makeStore().getSnapshot()).toBe(3);
  });

  it("reads a stored choice", () => {
    window.localStorage.setItem(KEY, "4");
    expect(makeStore().getSnapshot()).toBe(4);
  });

  it("ignores a stored value that is not an option", () => {
    window.localStorage.setItem(KEY, "7");
    expect(makeStore().getSnapshot()).toBe(3);
  });

  it("always renders the fallback on the server", () => {
    window.localStorage.setItem(KEY, "4");
    expect(makeStore().getServerSnapshot()).toBe(3);
  });

  it("stores a choice and notifies subscribers until they unsubscribe", () => {
    const store = makeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.choose(2);
    expect(store.getSnapshot()).toBe(2);
    expect(window.localStorage.getItem(KEY)).toBe("2");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.choose(4);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps working when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const store = makeStore();
    expect(store.getSnapshot()).toBe(3);
    store.choose(4);
    expect(store.getSnapshot()).toBe(4);
  });
});
