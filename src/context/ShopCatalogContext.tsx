import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { generateId } from '../utils/formatters';
import type { InventoryItem, ProductCategory } from '../types';

const STORAGE_KEY = 'shopmanager.catalog.v3';

function migrationFlagKey(shopId: string) {
  return `shopmanager.catalog.apiMigrated.${shopId}`;
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

async function readInventoryErrorMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: unknown };
    if (typeof j?.error === 'string' && j.error.trim()) return j.error.trim();
  } catch {
    /* ignore */
  }
  if (res.status === 401) return 'Session expired or not signed in. Please sign in again.';
  if (res.status === 403) return 'You do not have permission to view inventory.';
  return `Could not load inventory (HTTP ${res.status}).`;
}

const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.';

/** Parse `{ error }` from failed create/update/delete/import responses; map 401/403 for mutations. */
async function readInventoryMutationErrorMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: unknown };
    if (typeof j?.error === 'string' && j.error.trim()) return j.error.trim();
  } catch {
    /* ignore */
  }
  if (res.status === 401) return 'Session expired or not signed in. Please sign in again.';
  if (res.status === 403) return 'You do not have permission to change inventory.';
  return `Request failed (HTTP ${res.status}).`;
}

export type InventoryMutationResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type InventoryVoidResult = { ok: true } | { ok: false; error: string };
export type RenameCategoryResult = { ok: true } | { ok: false; error?: string };

/** Fetch every page from GET /shop/inventory (bounded page size per request). */
async function fetchInventoryAllPages(apiFetch: typeof api): Promise<{ ok: true; items: InventoryItem[] } | { ok: false; res: Response }> {
  const limit = 150;
  let page = 1;
  const merged: InventoryItem[] = [];
  const maxPages = 500;

  for (;;) {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await apiFetch(`/shop/inventory?${qs.toString()}`);
    if (!res.ok) return { ok: false, res };

    const body = (await res.json()) as {
      items?: Record<string, unknown>[];
      totalPages?: number;
    };
    const chunk = Array.isArray(body.items) ? body.items : [];
    merged.push(...chunk.map(mapApiRowToItem));

    const totalPages = Math.max(1, Math.floor(Number(body.totalPages)) || 1);
    if (page >= totalPages || chunk.length === 0) break;
    page++;
    if (page > maxPages) break;
  }

  return { ok: true, items: merged };
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
  return { items: [], categories: [] };
}

function mapApiRowToItem(row: Record<string, unknown>): InventoryItem {
  const n = (k: string) => row[k];
  return {
    id: String(n('id')),
    name: String(n('name') ?? ''),
    price: Number(n('price') ?? 0),
    stock: Number(n('stock') ?? 0),
    category: String(n('category') ?? ''),
    unit: String(n('unit') ?? 'piece'),
    costPrice: n('costPrice') != null && n('costPrice') !== '' ? Number(n('costPrice')) : undefined,
    mrp: n('mrp') != null && n('mrp') !== '' ? Number(n('mrp')) : undefined,
    discountPercent:
      n('discountPercent') != null && n('discountPercent') !== '' ? Number(n('discountPercent')) : undefined,
    sku: n('sku') != null ? String(n('sku')) : undefined,
    barcode: n('barcode') != null ? String(n('barcode')) : undefined,
    reorderLevel:
      n('reorderLevel') != null && n('reorderLevel') !== '' ? Number(n('reorderLevel')) : undefined,
    supplierId: n('supplierId') != null ? String(n('supplierId')) : undefined,
    hsn: n('hsn') != null ? String(n('hsn')) : undefined,
    taxRate: n('taxRate') != null && n('taxRate') !== '' ? Number(n('taxRate')) : undefined,
    expiryDate: n('expiryDate') != null ? String(n('expiryDate')) : undefined,
    batchNo: n('batchNo') != null ? String(n('batchNo')) : undefined,
    rackLocation: n('rackLocation') != null ? String(n('rackLocation')) : undefined,
    createdAt:
      n('createdAt') != null && String(n('createdAt')).trim() ? String(n('createdAt')) : undefined,
    updatedAt:
      n('updatedAt') != null && String(n('updatedAt')).trim() ? String(n('updatedAt')) : undefined,
  };
}

/** Single create/update body for POST / PATCH (optional fields omitted if empty). */
function itemToApiBody(item: Omit<InventoryItem, 'id'>) {
  const mrp = item.mrp ?? 0;
  if (mrp <= 0) {
    throw new Error('MRP is required');
  }
  const body: Record<string, unknown> = {
    name: item.name.trim(),
    category: item.category.trim(),
    unit: item.unit || 'piece',
    price: item.price,
    stock: Math.floor(item.stock),
    mrp,
    discountPercent: item.discountPercent ?? 0,
  };
  if (item.costPrice != null && item.costPrice !== undefined) {
    const c = Number(item.costPrice);
    if (!Number.isNaN(c)) body.costPrice = c;
  }
  if (item.sku) body.sku = item.sku;
  if (item.barcode) body.barcode = item.barcode;
  if (item.hsn) body.hsn = item.hsn;
  if (item.supplierId) body.supplierId = item.supplierId;
  if (item.expiryDate) body.expiryDate = item.expiryDate;
  if (item.batchNo) body.batchNo = item.batchNo;
  if (item.reorderLevel != null && item.reorderLevel !== undefined) body.reorderLevel = item.reorderLevel;
  if (item.taxRate != null && item.taxRate !== undefined) body.taxRate = item.taxRate;
  if (item.rackLocation) body.rackLocation = item.rackLocation;
  return body;
}

/** Bulk row (e.g. CSV): `price` is sell price; MRP defaults to sell when not set. */
function bulkRowToApiBody(row: Omit<InventoryItem, 'id'>) {
  const sell = Number(row.price);
  const mrp = row.mrp != null && row.mrp > 0 ? row.mrp : sell;
  const body: Record<string, unknown> = {
    name: row.name.trim(),
    category: row.category.trim(),
    unit: row.unit || 'piece',
    price: sell,
    stock: Math.floor(row.stock),
    mrp,
    discountPercent: row.discountPercent ?? 0,
  };
  if (row.costPrice != null && row.costPrice !== undefined) {
    const c = Number(row.costPrice);
    if (!Number.isNaN(c)) body.costPrice = c;
  }
  if (row.sku) body.sku = row.sku;
  if (row.barcode) body.barcode = row.barcode;
  if (row.reorderLevel != null && row.reorderLevel !== undefined) body.reorderLevel = row.reorderLevel;
  if (row.hsn) body.hsn = row.hsn;
  if (row.taxRate != null && row.taxRate !== undefined) body.taxRate = row.taxRate;
  if (row.supplierId) body.supplierId = row.supplierId;
  if (row.expiryDate) body.expiryDate = row.expiryDate;
  if (row.batchNo) body.batchNo = row.batchNo;
  if (row.rackLocation) body.rackLocation = row.rackLocation;
  return body;
}

function inventoryItemToBulkPayload(i: InventoryItem) {
  return bulkRowToApiBody({
    name: i.name,
    price: i.price,
    stock: i.stock,
    category: i.category,
    unit: i.unit,
    costPrice: i.costPrice,
    mrp: i.mrp,
    discountPercent: i.discountPercent,
    sku: i.sku,
    barcode: i.barcode,
    reorderLevel: i.reorderLevel,
    hsn: i.hsn,
    taxRate: i.taxRate,
    supplierId: i.supplierId,
    expiryDate: i.expiryDate,
    batchNo: i.batchNo,
  });
}

interface ShopCatalogContextValue {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  categories: ProductCategory[];
  allCategoryNames: string[];
  /** True until initial load finishes (auth + optional API fetch). */
  catalogLoading: boolean;
  /** Server-backed catalog (shop user with shopId). */
  useApiCatalog: boolean;
  addCategory: (name: string) => boolean;
  renameCategory: (id: string, newName: string) => Promise<RenameCategoryResult>;
  removeCategory: (id: string) => boolean;
  resetCatalogToDemo: () => void;
  createInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<InventoryMutationResult<InventoryItem>>;
  updateInventoryItem: (id: string, item: Omit<InventoryItem, 'id'>) => Promise<InventoryMutationResult<InventoryItem>>;
  deleteInventoryItem: (id: string) => Promise<InventoryVoidResult>;
  bulkImportInventoryItems: (rows: Omit<InventoryItem, 'id'>[]) => Promise<InventoryMutationResult<InventoryItem[]>>;
  bulkDeleteInventoryItems: (ids: string[]) => Promise<InventoryVoidResult>;
  refreshInventory: () => Promise<void>;
  /** Set when GET /shop/inventory fails in API mode — never use local catalog as fallback. */
  inventoryFetchError: string | null;
  dismissInventoryFetchError: () => void;
}

const ShopCatalogContext = createContext<ShopCatalogContextValue | undefined>(undefined);

export function ShopCatalogProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const useApiCatalog = Boolean(user?.shopId && user.role !== 'admin');

  const toastShownForInventoryErrorRef = useRef<string | null>(null);

  const [{ items, categories }, setState] = useState(loadCatalog);
  const catalogRef = useRef({ items, categories });
  catalogRef.current = { items, categories };

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [inventoryFetchError, setInventoryFetchError] = useState<string | null>(null);

  const dismissInventoryFetchError = useCallback(() => {
    setInventoryFetchError(null);
    toastShownForInventoryErrorRef.current = null;
  }, []);

  useEffect(() => {
    if (!inventoryFetchError) {
      toastShownForInventoryErrorRef.current = null;
      return;
    }
    if (toastShownForInventoryErrorRef.current === inventoryFetchError) return;
    toastShownForInventoryErrorRef.current = inventoryFetchError;
    addToast('error', 'Could not load inventory', inventoryFetchError);
  }, [inventoryFetchError, addToast]);

  const persistLocal = useCallback((next: { items: InventoryItem[]; categories: ProductCategory[] }) => {
    if (!useApiCatalog) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: next.items, categories: next.categories }));
    }
  }, [useApiCatalog]);

  const refreshInventory = useCallback(async () => {
    if (!useApiCatalog || !user?.shopId) return;
    setInventoryFetchError(null);
    toastShownForInventoryErrorRef.current = null;
    setCatalogLoading(true);
    try {
      const loaded = await fetchInventoryAllPages(api);
      if (!loaded.ok) {
        if (loaded.res.status === 401) {
          window.location.href = '/auth/login';
          return;
        }
        const msg = await readInventoryErrorMessage(loaded.res);
        setInventoryFetchError(msg);
        setState({ items: [], categories: [] });
        return;
      }
      const list = loaded.items;
      setState({
        items: list,
        categories: ensureCategoryCoverage(list, seedCategoriesFromItems(list)),
      });
    } catch {
      setInventoryFetchError(NETWORK_ERROR);
      setState({ items: [], categories: [] });
    } finally {
      setCatalogLoading(false);
    }
  }, [useApiCatalog, user?.shopId]);

  /** Signed out: restore local demo catalog so the next session does not reuse API data in memory. */
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setInventoryFetchError(null);
      setState(loadCatalog());
      setCatalogLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!useApiCatalog) {
      setInventoryFetchError(null);
      setCatalogLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setInventoryFetchError(null);
      if (!cancelled) {
        setState({ items: [], categories: [] });
      }
      try {
        const loaded = await fetchInventoryAllPages(api);
        if (cancelled) return;
        if (!loaded.ok) {
          if (loaded.res.status === 401) {
            window.location.href = '/auth/login';
            return;
          }
          const msg = await readInventoryErrorMessage(loaded.res);
          if (!cancelled) {
            setInventoryFetchError(msg);
            setState({ items: [], categories: [] });
          }
          return;
        }
        let list = loaded.items;

        if (list.length === 0 && user?.shopId && !localStorage.getItem(migrationFlagKey(user.shopId))) {
          const local = loadCatalog();
          if (local.items.length > 0) {
            const payload = {
              items: local.items.map(i => inventoryItemToBulkPayload(i)),
            };
            const bulk = await api('/shop/inventory/bulk', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            if (bulk.ok) {
              localStorage.setItem(migrationFlagKey(user.shopId), '1');
              localStorage.removeItem(STORAGE_KEY);
              const reload = await fetchInventoryAllPages(api);
              if (cancelled) return;
              if (!reload.ok) {
                if (reload.res.status === 401) {
                  window.location.href = '/auth/login';
                  return;
                }
                const retryMsg = await readInventoryErrorMessage(reload.res);
                if (!cancelled) {
                  setInventoryFetchError(retryMsg);
                  setState({ items: [], categories: [] });
                }
                return;
              }
              list = reload.items;
            }
          }
        }

        if (!cancelled) {
          setInventoryFetchError(null);
          setState({
            items: list,
            categories: ensureCategoryCoverage(list, seedCategoriesFromItems(list)),
          });
        }
      } catch {
        if (!cancelled) {
          setInventoryFetchError(NETWORK_ERROR);
          setState({ items: [], categories: [] });
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, useApiCatalog, user?.shopId]);

  useEffect(() => {
    persistLocal({ items, categories });
  }, [items, categories, persistLocal]);

  const setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>> = useCallback(
    updater => {
      setState(prev => {
        const nextItems = typeof updater === 'function' ? updater(prev.items) : updater;
        return {
          items: nextItems,
          categories: ensureCategoryCoverage(nextItems, prev.categories),
        };
      });
    },
    [],
  );

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

  const renameCategory = useCallback(
    async (id: string, newName: string): Promise<RenameCategoryResult> => {
      const trimmed = newName.trim();
      if (!trimmed) return { ok: false };

      const prev = catalogRef.current;
      const cat = prev.categories.find(c => c.id === id);
      if (!cat || cat.name === trimmed) return { ok: false };
      if (prev.categories.some(c => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
        return { ok: false };
      }
      const oldName = cat.name;

      if (useApiCatalog) {
        const res = await api('/shop/inventory/rename-category', {
          method: 'POST',
          body: JSON.stringify({ oldName, newName: trimmed }),
        });
        if (!res.ok) {
          return { ok: false, error: await readInventoryMutationErrorMessage(res) };
        }
      }

      setState(p => ({
        items: p.items.map(i => (i.category === oldName ? { ...i, category: trimmed } : i)),
        categories: p.categories
          .map(c => (c.id === id ? { ...c, name: trimmed } : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));
      return { ok: true };
    },
    [useApiCatalog],
  );

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
    if (useApiCatalog) return;
    setState({ items: [], categories: [] });
    localStorage.removeItem(STORAGE_KEY);
  }, [useApiCatalog]);

  const createInventoryItem = useCallback(
    async (item: Omit<InventoryItem, 'id'>): Promise<InventoryMutationResult<InventoryItem>> => {
      if (!useApiCatalog) {
        const id = generateId();
        const row: InventoryItem = { id, ...item, createdAt: new Date().toISOString() };
        setState(prev => ({
          items: [...prev.items, row],
          categories: ensureCategoryCoverage([...prev.items, row], prev.categories),
        }));
        return { ok: true, data: row };
      }
      try {
        const body = itemToApiBody(item);
        const res = await api('/shop/inventory', { method: 'POST', body: JSON.stringify(body) });
        if (!res.ok) {
          return { ok: false, error: await readInventoryMutationErrorMessage(res) };
        }
        const data = (await res.json()) as Record<string, unknown>;
        const row = mapApiRowToItem(data);
        setState(prev => ({
          items: [...prev.items, row],
          categories: ensureCategoryCoverage([...prev.items, row], prev.categories),
        }));
        return { ok: true, data: row };
      } catch {
        return { ok: false, error: NETWORK_ERROR };
      }
    },
    [useApiCatalog],
  );

  const updateInventoryItem = useCallback(
    async (id: string, item: Omit<InventoryItem, 'id'>): Promise<InventoryMutationResult<InventoryItem>> => {
      if (!useApiCatalog) {
        const row = { id, ...item };
        setState(prev => ({
          items: prev.items.map(i => (i.id === id ? row : i)),
          categories: ensureCategoryCoverage(
            prev.items.map(i => (i.id === id ? row : i)),
            prev.categories,
          ),
        }));
        return { ok: true, data: row };
      }
      try {
        const body = itemToApiBody(item);
        const res = await api(`/shop/inventory/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          return { ok: false, error: await readInventoryMutationErrorMessage(res) };
        }
        const data = (await res.json()) as Record<string, unknown>;
        const row = mapApiRowToItem(data);
        setState(prev => ({
          items: prev.items.map(i => (i.id === id ? row : i)),
          categories: ensureCategoryCoverage(
            prev.items.map(i => (i.id === id ? row : i)),
            prev.categories,
          ),
        }));
        return { ok: true, data: row };
      } catch {
        return { ok: false, error: NETWORK_ERROR };
      }
    },
    [useApiCatalog],
  );

  const deleteInventoryItem = useCallback(
    async (id: string): Promise<InventoryVoidResult> => {
      if (!useApiCatalog) {
        setState(prev => ({
          items: prev.items.filter(i => i.id !== id),
          categories: prev.categories,
        }));
        return { ok: true };
      }
      try {
        const res = await api(`/shop/inventory/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) {
          return { ok: false, error: await readInventoryMutationErrorMessage(res) };
        }
        setState(prev => ({
          items: prev.items.filter(i => i.id !== id),
          categories: prev.categories,
        }));
        return { ok: true };
      } catch {
        return { ok: false, error: NETWORK_ERROR };
      }
    },
    [useApiCatalog],
  );

  const bulkImportInventoryItems = useCallback(
    async (rows: Omit<InventoryItem, 'id'>[]): Promise<InventoryMutationResult<InventoryItem[]>> => {
      if (rows.length === 0) return { ok: true, data: [] };
      if (!useApiCatalog) {
        const imported: InventoryItem[] = rows.map(r => ({
          id: generateId(),
          ...r,
          createdAt: new Date().toISOString(),
        }));
        setState(prev => ({
          items: [...imported, ...prev.items],
          categories: ensureCategoryCoverage([...imported, ...prev.items], prev.categories),
        }));
        return { ok: true, data: imported };
      }
      const payload = { items: rows.map(r => bulkRowToApiBody(r)) };
      try {
        const res = await api('/shop/inventory/bulk', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          return { ok: false, error: await readInventoryMutationErrorMessage(res) };
        }
        const data = (await res.json()) as { items?: Record<string, unknown>[] };
        const created = (data.items ?? []).map(mapApiRowToItem);
        setState(prev => ({
          items: [...created, ...prev.items],
          categories: ensureCategoryCoverage([...created, ...prev.items], prev.categories),
        }));
        return { ok: true, data: created };
      } catch {
        return { ok: false, error: NETWORK_ERROR };
      }
    },
    [useApiCatalog],
  );

  const bulkDeleteInventoryItems = useCallback(
    async (ids: string[]): Promise<InventoryVoidResult> => {
      if (ids.length === 0) return { ok: true };
      if (!useApiCatalog) {
        const idSet = new Set(ids);
        setState(prev => ({
          items: prev.items.filter(i => !idSet.has(i.id)),
          categories: prev.categories,
        }));
        return { ok: true };
      }
      try {
        const res = await api('/shop/inventory/bulk-delete', {
          method: 'POST',
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) {
          return { ok: false, error: await readInventoryMutationErrorMessage(res) };
        }
        const idSet = new Set(ids);
        setState(prev => ({
          items: prev.items.filter(i => !idSet.has(i.id)),
          categories: prev.categories,
        }));
        return { ok: true };
      } catch {
        return { ok: false, error: NETWORK_ERROR };
      }
    },
    [useApiCatalog],
  );

  const value = useMemo<ShopCatalogContextValue>(
    () => ({
      items,
      setItems,
      categories,
      allCategoryNames,
      catalogLoading,
      useApiCatalog,
      addCategory,
      renameCategory,
      removeCategory,
      resetCatalogToDemo,
      createInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      bulkImportInventoryItems,
      bulkDeleteInventoryItems,
      refreshInventory,
      inventoryFetchError,
      dismissInventoryFetchError,
    }),
    [
      items,
      setItems,
      categories,
      allCategoryNames,
      catalogLoading,
      useApiCatalog,
      addCategory,
      renameCategory,
      removeCategory,
      resetCatalogToDemo,
      createInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      bulkImportInventoryItems,
      bulkDeleteInventoryItems,
      refreshInventory,
      inventoryFetchError,
      dismissInventoryFetchError,
    ],
  );

  return <ShopCatalogContext.Provider value={value}>{children}</ShopCatalogContext.Provider>;
}

export function useShopCatalog() {
  const ctx = useContext(ShopCatalogContext);
  if (!ctx) throw new Error('useShopCatalog must be used within ShopCatalogProvider');
  return ctx;
}
