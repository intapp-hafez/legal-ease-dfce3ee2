import { useCallback, useEffect, useState } from "react";

export type Row = Record<string, string | number>;

const PREFIX = "int-legal:";

function load<T extends Row>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return seed;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : seed;
  } catch {
    return seed;
  }
}

/** Client-side persisted collection with create / update / delete. */
export function useCollection<T extends Row>(key: string, seed: T[], idKey: keyof T) {
  const [items, setItems] = useState<T[]>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(load<T>(key, seed));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const persist = useCallback(
    (next: T[]) => {
      setItems(next);
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(next));
      } catch {
        /* storage full or unavailable */
      }
    },
    [key],
  );

  const create = useCallback(
    (row: T) => persist([row, ...items]),
    [items, persist],
  );

  const update = useCallback(
    (id: string | number, row: T) =>
      persist(items.map((it) => (it[idKey] === id ? { ...it, ...row } : it))),
    [items, persist, idKey],
  );

  const remove = useCallback(
    (id: string | number) => persist(items.filter((it) => it[idKey] !== id)),
    [items, persist, idKey],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
    setItems(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, seed]);

  return { items, hydrated, create, update, remove, reset };
}

/** Generates the next sequential code like "DOC-1009" from existing rows. */
export function nextId(items: Row[], idKey: string, prefix: string, fallback = 1) {
  const nums = items
    .map((i) => String(i[idKey] ?? ""))
    .map((v) => Number(v.replace(/\D+/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  const next = nums.length ? Math.max(...nums) + 1 : fallback;
  return `${prefix}${next}`;
}
