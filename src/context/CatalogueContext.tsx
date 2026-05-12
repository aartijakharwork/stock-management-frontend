import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { catalogueSeed } from '../data/catalogue-seed';
import { generateId } from '../utils/formatters';
import type { CatalogueItem } from '../types';

const STORAGE_KEY = 'shopmanager.catalogue.v1';

function load(): CatalogueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as CatalogueItem[];
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch { /* ignore */ }
  return JSON.parse(JSON.stringify(catalogueSeed)) as CatalogueItem[];
}

interface CatalogueContextValue {
  items: CatalogueItem[];
  addItem: (item: Omit<CatalogueItem, 'id'>) => void;
  updateItem: (id: string, patch: Partial<Omit<CatalogueItem, 'id'>>) => void;
  deleteItem: (id: string) => void;
  importItems: (rows: Omit<CatalogueItem, 'id'>[]) => number;
  resetToDemo: () => void;
}

const CatalogueContext = createContext<CatalogueContextValue | undefined>(undefined);

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CatalogueItem[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CatalogueItem, 'id'>) => {
    setItems(prev => [{ id: generateId(), ...item }, ...prev]);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<Omit<CatalogueItem, 'id'>>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const importItems = useCallback((rows: Omit<CatalogueItem, 'id'>[]): number => {
    const newItems = rows.map(r => ({ id: generateId(), ...r }));
    setItems(prev => [...newItems, ...prev]);
    return newItems.length;
  }, []);

  const resetToDemo = useCallback(() => {
    const fresh = JSON.parse(JSON.stringify(catalogueSeed)) as CatalogueItem[];
    setItems(fresh);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<CatalogueContextValue>(
    () => ({ items, addItem, updateItem, deleteItem, importItems, resetToDemo }),
    [items, addItem, updateItem, deleteItem, importItems, resetToDemo],
  );

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue() {
  const ctx = useContext(CatalogueContext);
  if (!ctx) throw new Error('useCatalogue must be used within CatalogueProvider');
  return ctx;
}
