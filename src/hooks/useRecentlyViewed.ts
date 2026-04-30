import { useCallback, useEffect, useState } from 'react';

export type RecentKind = 'bill' | 'customer' | 'item';

export interface RecentItem {
  kind: RecentKind;
  id: string;
  label: string;
  sublabel?: string;
  to: string;
  viewedAt: string; // ISO
}

const STORAGE_KEY = 'shopmanager.recent';
const MAX_ITEMS = 6;

function read(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x: unknown): x is RecentItem =>
      typeof x === 'object' && x !== null &&
      'kind' in x && 'id' in x && 'label' in x && 'viewedAt' in x
    );
  } catch {
    return [];
  }
}

function write(items: RecentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota / private mode — silently no-op */
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const track = useCallback((entry: Omit<RecentItem, 'viewedAt'>) => {
    setItems(prev => {
      const without = prev.filter(p => !(p.kind === entry.kind && p.id === entry.id));
      const next: RecentItem[] = [{ ...entry, viewedAt: new Date().toISOString() }, ...without].slice(0, MAX_ITEMS);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  return { items, track, clear };
}
