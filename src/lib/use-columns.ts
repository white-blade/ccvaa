/**
 * A remembered "how many per row" choice, used by the gallery grid. Kept generic
 * so another grid can have its own key and options.
 *
 * The value lives outside React, in `localStorage`, and is read through
 * `useSyncExternalStore`. The prerendered HTML is built once at `next build` with no
 * visitor and no storage, so the server snapshot is always the fallback and React
 * swaps in the stored choice right after hydration. An in-memory mirror keeps the
 * control working when storage is blocked — a visitor in private browsing loses the
 * memory, not the feature.
 *
 * Returns the store pieces rather than a ready-made hook so each component can call
 * `useSyncExternalStore` from its own `use…` function, which is where the React
 * hooks lint rules expect to find it.
 */
type ColumnStore<T extends number> = {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  /** Records the choice and notifies subscribers. */
  choose: (next: T) => void;
};

export function createColumnStore<T extends number>(
  storageKey: string,
  options: readonly T[],
  fallback: T,
): ColumnStore<T> {
  let current: T | null = null;
  const listeners = new Set<() => void>();

  function isOption(value: number): value is T {
    return (options as readonly number[]).includes(value);
  }

  function read(): T {
    try {
      const stored = Number(window.localStorage.getItem(storageKey));
      if (isOption(stored)) {
        return stored;
      }
    } catch {
      // Storage blocked or unavailable — the fallback stands.
    }
    return fallback;
  }

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    getSnapshot() {
      current ??= read();
      return current;
    },
    getServerSnapshot() {
      return fallback;
    },
    choose(next) {
      current = next;
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        // Not worth surfacing: the layout still changed for this visit.
      }
      for (const listener of listeners) {
        listener();
      }
    },
  };
}
