import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { inventoryItems as seedItems } from '../data/shop-dummy';
import { generateId } from '../utils/formatters';
import type { InventoryItem, ProductCategory } from '../types';

// v2: schema bumped — items now carry mrp + discountPercent. Old v1 caches
// without these fields are ignored so mock data with realistic MRP/discount
// shows up on next load.
const STORAGE_KEY = 'shopmanager.catalog.v2';

function cloneItems(items: InventoryItem[]): InventoryItem[] {
  return JSON.parse(JSON.stringify(items)) as InventoryItem[];
}

function seedCategoriesFromItems(items: InventoryItem[]): ProductCategory[] {
  const names = [...new Set(items.map(i => i.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  return names.map(name => ({ id: generateId(), name }));
}

function ensureCategoryCoverage(items: InventoryItem[], categories: ProductCategory[]): ProductCategory[] {
  const byName = new Map(categories.map(c => [c.name, c]));
  for (const i of items) {
    if (i.category && !byName.has(i.category)) {
      const nc: ProductCategory = { id: generateId(), name: i.category };
      byName.set(i.category, nc);
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function loadCatalog(): { items: InventoryItem[]; categories: ProductCategory[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as { items?: InventoryItem[]; categories?: ProductCategory[] };
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const categories =
          Array.isArray(data.categories) && data.categories.length
            ? data.categories
            : seedCategoriesFromItems(data.items);
        return {
          items: data.items,
          categories: ensureCategoryCoverage(data.items, categories),
        };
      }
    }
  } catch {
    /* ignore */
  }
  const items = cloneItems(seedItems);
  return { items, categories: seedCategoriesFromItems(items) };
}

interface ShopCatalogContextValue {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  categories: ProductCategory[];
  /** Distinct category names from catalog + any used on items (for filters & dropdowns). */
  allCategoryNames: string[];
  addCategory: (name: string) => boolean;
  renameCategory: (id: string, newName: string) => boolean;
  removeCategory: (id: string) => boolean;
  resetCatalogToDemo: () => void;
}

const ShopCatalogContext = createContext<ShopCatalogContextValue | undefined>(undefined);

export function ShopCatalogProvider({ children }: { children: ReactNode }) {
  const [{ items, categories }, setState] = useState(loadCatalog);

  const setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>> = useCallback(updater => {
    setState(prev => {
      const nextItems = typeof updater === 'function' ? updater(prev.items) : updater;
      return {
        items: nextItems,
        categories: ensureCategoryCoverage(nextItems, prev.categories),
      };
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, categories }));
  }, [items, categories]);

  const allCategoryNames = useMemo(() => {
    const s = new Set<string>();
    categories.forEach(c => s.add(c.name));
    items.forEach(i => {
      if (i.category) s.add(i.category);
    });
    return [...s].sort();
  }, [items, categories]);

  const addCategory = useCallback((name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    let added = false;
    setState(prev => {
      if (prev.categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      added = true;
      const nextCats = [...prev.categories, { id: generateId(), name: trimmed }].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      return { ...prev, categories: nextCats };
    });
    return added;
  }, []);

  const renameCategory = useCallback((id: string, newName: string): boolean => {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    let ok = false;
    setState(prev => {
      const cat = prev.categories.find(c => c.id === id);
      if (!cat || cat.name === trimmed) return prev;
      if (prev.categories.some(c => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      ok = true;
      const oldName = cat.name;
      const nextCats = prev.categories
        .map(c => (c.id === id ? { ...c, name: trimmed } : c))
        .sort((a, b) => a.name.localeCompare(b.name));
      const nextItems = prev.items.map(i =>
        i.category === oldName ? { ...i, category: trimmed } : i,
      );
      return { items: nextItems, categories: nextCats };
    });
    return ok;
  }, []);

  const removeCategory = useCallback((id: string): boolean => {
    let removed = false;
    setState(prev => {
      const cat = prev.categories.find(c => c.id === id);
      if (!cat) return prev;
      if (prev.items.some(i => i.category === cat.name)) return prev;
      removed = true;
      return {
        ...prev,
        categories: prev.categories.filter(c => c.id !== id),
      };
    });
    return removed;
  }, []);

  const resetCatalogToDemo = useCallback(() => {
    const fresh = cloneItems(seedItems);
    setState({ items: fresh, categories: seedCategoriesFromItems(fresh) });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<ShopCatalogContextValue>(
    () => ({
      items,
      setItems,
      categories,
      allCategoryNames,
      addCategory,
      renameCategory,
      removeCategory,
      resetCatalogToDemo,
    }),
    [
      items,
      setItems,
      categories,
      allCategoryNames,
      addCategory,
      renameCategory,
      removeCategory,
      resetCatalogToDemo,
    ],
  );

  return <ShopCatalogContext.Provider value={value}>{children}</ShopCatalogContext.Provider>;
}

export function useShopCatalog() {
  const ctx = useContext(ShopCatalogContext);
  if (!ctx) throw new Error('useShopCatalog must be used within ShopCatalogProvider');
  return ctx;
}
