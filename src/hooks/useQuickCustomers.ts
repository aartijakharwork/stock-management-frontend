import { useEffect, useState, useCallback } from 'react';
import type { Customer } from '../types';

const KEY = 'shopmanager.quickcustomers';

function read(): Customer[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Customer[];
  } catch {
    return [];
  }
}

function write(list: Customer[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
}

export function useQuickCustomers() {
  const [list, setList] = useState<Customer[]>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) setList(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((c: { name?: string; phone?: string }) => {
    const name = (c.name || '').trim();
    const phone = (c.phone || '').trim();
    if (!name && !phone) return null;
    const current = read();
    const dupe = current.find(x =>
      (phone && x.phone === phone) ||
      (!phone && name && x.name.toLowerCase() === name.toLowerCase())
    );
    if (dupe) return dupe;
    const entry: Customer = {
      id: 'QC-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      name: name || 'Unnamed',
      phone,
      pendingAmount: 0,
    };
    const next = [entry, ...current].slice(0, 200);
    write(next);
    setList(next);
    return entry;
  }, []);

  return { customers: list, add };
}
