import { useEffect, useState, useCallback } from 'react';
import type { HeldBill } from '../types';
const KEY = 'shopmanager.heldbills';

function read(): HeldBill[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HeldBill[];
  } catch {
    return [];
  }
}

function write(list: HeldBill[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  // trigger same-tab listeners
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
}

export function useHeldBills() {
  const [held, setHeld] = useState<HeldBill[]>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) setHeld(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((bill: Omit<HeldBill, 'ref' | 'createdAt'> & { ref?: string }) => {
    const ref = bill.ref ?? 'DRAFT-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const entry: HeldBill = { ...bill, ref, createdAt: new Date().toISOString() };
    const next = [entry, ...read()].slice(0, 20);
    write(next);
    setHeld(next);
    return entry;
  }, []);

  const remove = useCallback((ref: string) => {
    const next = read().filter(h => h.ref !== ref);
    write(next);
    setHeld(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setHeld([]);
  }, []);

  return { held, add, remove, clear };
}
