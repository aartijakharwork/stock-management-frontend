import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  PackageX,
  Package,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Upload,
  Sparkles,
  Tags,
  Eye,
  EyeOff,
  Lock,
  Calendar,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CompactStat } from '../../components/ui/CompactStat';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExportMenu } from '../../components/ui/ExportMenu';
import { CardListSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { JargonHint } from '../../components/ui/JargonHint';
import { Highlight } from '../../components/ui/Highlight';
import { Checkbox } from '../../components/ui/Checkbox';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { useShopCatalog } from '../../context/ShopCatalogContext';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import type { InventoryItem, SortState } from '../../types';
import type { ExportColumn } from '../../utils/exporters';
import { useCostPriceSecurity } from '../../hooks/useCostPriceSecurity';

const DEFAULT_REORDER = 10;
const DEFAULT_TAX_RATE = 18;

function supplierIdLabel(id?: string): string | undefined {
  const t = id?.trim();
  return t || undefined;
}

const emptyItem: Omit<InventoryItem, 'id'> = {
  name: '',
  price: 0,
  stock: 0,
  category: '',
  unit: 'piece',
  costPrice: 0,
  mrp: 0,
  discountPercent: 0,
  sku: '',
  barcode: '',
  reorderLevel: DEFAULT_REORDER,
  supplierId: '',
  hsn: '',
  taxRate: DEFAULT_TAX_RATE,
  expiryDate: '',
  batchNo: '',
  rackLocation: '',
};

const computeSellPrice = (mrp?: number, discountPercent?: number) => {
  const m = mrp ?? 0;
  const d = Math.max(0, Math.min(100, discountPercent ?? 0));
  return Math.round(m * (1 - d / 100));
};

const isLowStock = (i: InventoryItem) => i.stock > 0 && i.stock <= (i.reorderLevel ?? DEFAULT_REORDER);

const stockStatus = (i: InventoryItem) =>
  i.stock === 0 ? 'Out of stock'
  : isLowStock(i) ? 'Low (below reorder)'
  : 'In stock';

const calcMargin = (cost?: number, sell?: number) => {
  if (!cost || !sell || cost <= 0 || sell <= 0) return null;
  return ((sell - cost) / sell) * 100;
};

const INVENTORY_EXPORT_COLUMNS: ExportColumn<InventoryItem>[] = [
  { header: 'SKU', accessor: i => i.sku ?? '' },
  { header: 'Name', accessor: i => i.name },
  { header: 'Category', accessor: i => i.category },
  { header: 'Unit', accessor: i => i.unit },
  { header: 'Cost (₹)', accessor: i => i.costPrice ?? '' },
  { header: 'Price (₹)', accessor: i => i.price },
  { header: 'Margin %', accessor: i => {
    const m = calcMargin(i.costPrice, i.price);
    return m == null ? '' : m.toFixed(1);
  } },
  { header: 'Stock', accessor: i => i.stock },
  { header: 'Reorder level', accessor: i => i.reorderLevel ?? '' },
  { header: 'Stock value (₹)', accessor: i => i.price * i.stock },
  { header: 'HSN', accessor: i => i.hsn ?? '' },
  { header: 'Tax %', accessor: i => i.taxRate ?? '' },
  { header: 'Status', accessor: i => stockStatus(i) },
];

function StockPill({ item }: { item: InventoryItem }) {
  const { stock, unit } = item;
  const label = `${stock} ${unit}${stock === 1 ? '' : 's'}`;
  if (stock === 0) return <Badge variant="danger">Out of stock</Badge>;
  if (isLowStock(item)) return <Badge variant="warning">{label}</Badge>;
  return <Badge variant="success">{label}</Badge>;
}

type StockFilter = '' | 'low' | 'out';

/** Client-side filter uses this term; above the threshold it follows `search` via useDeferredValue to cut work per keystroke. */
const SEARCH_DEFER_ITEMS_THRESHOLD = 400;

type AddedFilter = '' | '7d' | '30d' | 'custom';

function itemCreatedTimeMs(item: InventoryItem): number | null {
  if (!item.createdAt) return null;
  const t = Date.parse(item.createdAt);
  return Number.isNaN(t) ? null : t;
}

/** By server/local `createdAt`. Items without a date are excluded when a non-all preset or custom range applies. */
function matchesAddedFilter(item: InventoryItem, preset: AddedFilter, from: string, to: string): boolean {
  const t = itemCreatedTimeMs(item);
  const now = Date.now();
  const dayMs = 864e5;

  if (preset === 'custom' && !from.trim() && !to.trim()) return true;

  if (preset === '7d') {
    if (t == null) return false;
    return t >= now - 7 * dayMs;
  }
  if (preset === '30d') {
    if (t == null) return false;
    return t >= now - 30 * dayMs;
  }
  if (preset === 'custom') {
    if (t == null) return false;
    const start = from.trim() ? new Date(`${from.trim()}T00:00:00`).getTime() : -Infinity;
    const end = to.trim() ? new Date(`${to.trim()}T23:59:59.999`).getTime() : Infinity;
    return t >= start && t <= end;
  }
  return true;
}

export function ShopInventory() {
  const {
    items,
    allCategoryNames,
    addCategory,
    catalogLoading,
    useApiCatalog,
    inventoryFetchError,
    dismissInventoryFetchError,
    refreshInventory,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    bulkImportInventoryItems,
    bulkDeleteInventoryItems,
  } = useShopCatalog();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('');
  const [addedFilter, setAddedFilter] = useState<AddedFilter>('');
  const [addedFrom, setAddedFrom] = useState('');
  const [addedTo, setAddedTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<InventoryItem, 'id'>>(emptyItem);
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savePending, setSavePending] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const { addToast } = useToast();
  const { can, isStaff } = usePermissions();
  const { track } = useRecentlyViewed();
  const cpSec = useCostPriceSecurity();
  const [cpPinInput, setCpPinInput] = useState('');
  const [cpPinModalOpen, setCpPinModalOpen] = useState(false);
  const [costCodeInput, setCostCodeInput] = useState('');

  const canAdd = can('inventory', 'add');
  const canEdit = can('inventory', 'edit');
  const canDelete = can('inventory', 'delete');

  const exportColumns = useMemo(() =>
    cpSec.isCostHidden
      ? INVENTORY_EXPORT_COLUMNS.filter(c => c.header !== 'Cost (₹)' && c.header !== 'Margin %')
      : INVENTORY_EXPORT_COLUMNS,
    [cpSec.isCostHidden],
  );

  /** Distinct supplier IDs already present on catalog items — datalist suggestions only; any string up to 64 chars is allowed. */
  const supplierIdSuggestions = useMemo(() => {
    const s = new Set<string>();
    for (const i of items) {
      const id = i.supplierId?.trim();
      if (id) s.add(id);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const allCategories = allCategoryNames;

  const categoryFormOptions = useMemo(() => [
    { label: 'Select category', value: '' },
    ...allCategories.map(c => ({ label: c, value: c })),
  ], [allCategories]);

  const searchForFilter =
    items.length >= SEARCH_DEFER_ITEMS_THRESHOLD ? deferredSearch : search;

  const filtered = useMemo(() => {
    const term = searchForFilter.trim().toLowerCase();
    return items.filter(i => {
      const matchesSearch = !term
        || i.name.toLowerCase().includes(term)
        || i.category.toLowerCase().includes(term)
        || (i.sku?.toLowerCase().includes(term) ?? false)
        || (i.barcode?.toLowerCase().includes(term) ?? false)
        || (i.hsn?.toLowerCase().includes(term) ?? false);
      const matchesCat = !categoryFilter || i.category === categoryFilter;
      const matchesStock = !stockFilter
        || (stockFilter === 'low' && isLowStock(i))
        || (stockFilter === 'out' && i.stock === 0);
      const matchesAdded = matchesAddedFilter(i, addedFilter, addedFrom, addedTo);
      return matchesSearch && matchesCat && matchesStock && matchesAdded;
    });
  }, [items, searchForFilter, categoryFilter, stockFilter, addedFilter, addedFrom, addedTo]);

  const [sortState, setSortState] = useState<SortState | null>(null);
  const sortFns: Record<string, (a: InventoryItem, b: InventoryItem) => number> = {
    item: (a, b) => a.name.localeCompare(b.name),
    cost: (a, b) => (a.costPrice ?? 0) - (b.costPrice ?? 0),
    mrp: (a, b) => (a.mrp ?? a.price) - (b.mrp ?? b.price),
    discount: (a, b) => (a.discountPercent ?? 0) - (b.discountPercent ?? 0),
    stock: (a, b) => a.stock - b.stock,
    value: (a, b) => a.price * a.stock - b.price * b.stock,
  };
  const sorted = useMemo(() => {
    if (!sortState || !sortFns[sortState.key]) return filtered;
    const arr = [...filtered].sort(sortFns[sortState.key]);
    return sortState.direction === 'desc' ? arr.reverse() : arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sortState]);
  const toggleSort = (key: string) => {
    setSortState(prev => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const PAGE = 25;
  const [displayCount, setDisplayCount] = useState(PAGE);
  useEffect(() => {
    setDisplayCount(PAGE);
  }, [searchForFilter, categoryFilter, stockFilter, addedFilter, addedFrom, addedTo, sortState, items.length]);
  const visible = sorted.slice(0, displayCount);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setDisplayCount(c => Math.min(c + PAGE, sorted.length));
      }
    }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [sorted.length, displayCount]);

  const totalValue = useMemo(() => items.reduce((s, i) => s + i.price * i.stock, 0), [items]);
  const lowStockCount = useMemo(() => items.filter(isLowStock).length, [items]);
  const outOfStockCount = useMemo(() => items.filter(i => i.stock === 0).length, [items]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyItem);
    setAddingCategory(false);
    setNewCategory('');
    setShowAdvanced(false);
    setCostCodeInput('');
    setModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setCostCodeInput(cpSec.codedInputEnabled && item.costPrice ? cpSec.encodePrice(item.costPrice) : '');
    setForm({
      name: item.name,
      price: item.price,
      stock: item.stock,
      category: item.category,
      unit: item.unit,
      costPrice: item.costPrice ?? 0,
      // Back-fill MRP/discount for legacy items: treat the existing price as
      // MRP with 0% discount so the form renders sensibly.
      mrp: item.mrp ?? item.price ?? 0,
      discountPercent: item.discountPercent ?? 0,
      sku: item.sku ?? '',
      barcode: item.barcode ?? '',
      reorderLevel: item.reorderLevel ?? DEFAULT_REORDER,
      supplierId: item.supplierId ?? '',
      hsn: item.hsn ?? '',
      taxRate: item.taxRate ?? DEFAULT_TAX_RATE,
      expiryDate: item.expiryDate ?? '',
      batchNo: item.batchNo ?? '',
      rackLocation: item.rackLocation ?? '',
    });
    setAddingCategory(false);
    setNewCategory('');
    setShowAdvanced(Boolean(item.sku || item.barcode || item.hsn || item.supplierId || item.rackLocation));
    setModalOpen(true);
    track({
      kind: 'item',
      id: item.id,
      label: item.name,
      sublabel: `${item.category} · ${formatCurrency(item.price)} · ${item.stock} ${item.unit}${item.stock === 1 ? '' : 's'}`,
      to: '/shop/inventory',
    });
  };

  const openView = (item: InventoryItem) => {
    setViewItem(item);
    setViewModalOpen(true);
    track({
      kind: 'item',
      id: item.id,
      label: item.name,
      sublabel: `${item.category} · ${formatCurrency(item.price)} · ${item.stock} ${item.unit}${item.stock === 1 ? '' : 's'}`,
      to: '/shop/inventory',
    });
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (!addCategory(trimmed)) {
      addToast('warning', 'Category already exists');
      return;
    }
    setForm(f => ({ ...f, category: trimmed }));
    setNewCategory('');
    setAddingCategory(false);
    addToast('success', `Category "${trimmed}" added`);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      addToast('error', 'Please fill required fields');
      return;
    }
    if (!form.mrp || form.mrp <= 0) {
      addToast('error', 'MRP is required');
      return;
    }
    const sellPrice = computeSellPrice(form.mrp, form.discountPercent);
    if (form.costPrice && sellPrice && form.costPrice > sellPrice) {
      addToast('warning', 'Cost is higher than selling price — margin will be negative');
    }
    const next = { ...form, price: sellPrice };
    setSavePending(true);
    try {
      if (editing) {
        const result = await updateInventoryItem(editing.id, next);
        if (!result.ok) {
          addToast('error', 'Could not save changes', result.error);
          return;
        }
        addToast('success', 'Item updated');
      } else {
        const result = await createInventoryItem(next);
        if (!result.ok) {
          addToast('error', 'Could not add item', result.error);
          return;
        }
        addToast('success', 'Item added');
      }
      setModalOpen(false);
    } finally {
      setSavePending(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const result = await deleteInventoryItem(id);
    if (!result.ok) {
      addToast('error', 'Could not delete item', result.error);
      return;
    }
    addToast('success', 'Item deleted');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allPageSelected = visible.length > 0 && visible.every(i => selectedIds.has(i.id));
  const somePageSelected = visible.some(i => selectedIds.has(i.id));
  const toggleSelectAll = () => {
    if (allPageSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(visible.map(i => i.id)));
  };
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`)) return;
    const ids = [...selectedIds];
    const result = await bulkDeleteInventoryItems(ids);
    if (!result.ok) {
      addToast('error', 'Could not delete items', result.error);
      return;
    }
    addToast('success', `${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'} deleted`);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-3">
      {/* Title row — heading + actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/shop/settings?tab=categories"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg font-medium h-9 px-3 text-xs border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Tags size={14} />
            Categories
          </Link>
          <ExportMenu<InventoryItem>
            baseName="inventory"
            title="Inventory export"
            meta={`${filtered.length} of ${items.length} items`}
            columns={exportColumns}
            rows={filtered}
            size="sm"
          />
          {!isStaff && cpSec.enabled && (
            cpSec.revealed
              ? <Button variant="ghost" size="sm" icon={<EyeOff size={14} />} onClick={() => cpSec.hide()}>Hide Cost</Button>
              : <Button variant="secondary" size="sm" icon={<Eye size={14} />} onClick={() => setCpPinModalOpen(true)}>Reveal Cost</Button>
          )}
          {canAdd && <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => setImportOpen(true)}>Import</Button>}
          {canAdd && <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAdd}>Add item</Button>}
        </div>
      </div>

      {useApiCatalog && inventoryFetchError && (
        <div
          role="alert"
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-red-200 bg-red-50 dark:border-red-500/35 dark:bg-red-500/10 px-4 py-3"
        >
          <div className="flex gap-3 items-start min-w-0">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">Inventory could not be loaded</p>
              <p className="text-xs text-red-800/90 dark:text-red-200/90 mt-1 break-words">{inventoryFetchError}</p>
              <p className="text-[11px] text-red-700/80 dark:text-red-300/80 mt-1">
                Showing no items until the server responds — cached offline data is not used for shop inventory.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              disabled={catalogLoading}
              onClick={() => void refreshInventory()}
            >
              Retry
            </Button>
            <Button variant="ghost" size="sm" onClick={dismissInventoryFetchError}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Compact stat tiles — full visual prominence, half the height of the old StatCards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <CompactStat
          icon={<Package size={16} />}
          tone="emerald"
          title="Total items"
          value={String(items.length)}
        />
        <CompactStat
          icon={<TrendingUp size={16} />}
          tone="blue"
          title="Stock value"
          value={formatCurrency(totalValue)}
        />
        <CompactStat
          icon={<AlertTriangle size={16} />}
          tone={lowStockCount > 0 ? 'amber' : 'gray'}
          title="Below reorder"
          value={String(lowStockCount)}
          subtitle={lowStockCount > 0 ? 'Action needed' : 'All good'}
          subtitleTone={lowStockCount > 0 ? 'warn' : 'good'}
          onClick={lowStockCount > 0 ? () => { setStockFilter('low'); setCategoryFilter(''); } : undefined}
        />
        <CompactStat
          icon={<PackageX size={16} />}
          tone={outOfStockCount > 0 ? 'red' : 'gray'}
          title="Out of stock"
          value={String(outOfStockCount)}
          subtitle={outOfStockCount > 0 ? 'Reorder now' : 'All stocked'}
          subtitleTone={outOfStockCount > 0 ? 'bad' : 'good'}
          onClick={outOfStockCount > 0 ? () => { setStockFilter('out'); setCategoryFilter(''); } : undefined}
        />
      </div>

      {/* Single-row filter bar — search + status pills + category dropdown */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex-1 min-w-0">
          <SearchInput placeholder="Search by name, SKU, barcode, HSN..." value={search} onSearch={setSearch} />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
          {[
            { key: '', label: 'All' },
            { key: 'low', label: 'Low' },
            { key: 'out', label: 'Out' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setStockFilter(t.key as typeof stockFilter); setCategoryFilter(''); }}
              className={`px-2.5 h-8 rounded text-[11px] font-medium transition-colors ${
                stockFilter === t.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="lg:w-52">
          <SearchableSelect
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setStockFilter(''); }}
            options={[
              { label: 'All categories', value: '' },
              ...allCategories.map(c => ({ label: c, value: c })),
            ]}
            placeholder="All categories"
            clearable={!!categoryFilter}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 min-w-0 w-full lg:flex-1 lg:min-w-[220px]">
          <Calendar size={14} className="text-gray-400 shrink-0 hidden sm:block" aria-hidden />
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 shrink-0">Added</span>
          <select
            aria-label="Filter by date added"
            value={addedFilter}
            onChange={e => {
              const v = e.target.value as AddedFilter;
              setAddedFilter(v);
              if (v !== 'custom') {
                setAddedFrom('');
                setAddedTo('');
              }
            }}
            className="h-10 min-w-0 flex-1 sm:flex-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:focus:border-emerald-500"
          >
            <option value="">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="custom">Custom range</option>
          </select>
          {addedFilter === 'custom' && (
            <>
              <input
                type="date"
                value={addedFrom}
                onChange={e => setAddedFrom(e.target.value)}
                className="h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 dark:focus:border-emerald-500"
                aria-label="Added from"
              />
              <span className="text-gray-400 hidden sm:inline">–</span>
              <input
                type="date"
                value={addedTo}
                onChange={e => setAddedTo(e.target.value)}
                className="h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 dark:focus:border-emerald-500"
                aria-label="Added to"
              />
            </>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 animate-fade-in-up">
          <Checkbox checked={allPageSelected} indeterminate={somePageSelected && !allPageSelected} onChange={toggleSelectAll} />
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <ExportMenu<InventoryItem>
            baseName="inventory-selected"
            title="Export selected"
            meta={`${selectedIds.size} items`}
            columns={exportColumns}
            rows={items.filter(i => selectedIds.has(i.id))}
            size="sm"
          />
          {canDelete && (
            <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={bulkDelete}>
              Delete ({selectedIds.size})
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Cancel</Button>
        </div>
      )}

      {catalogLoading ? (
        <>
          <div className="hidden sm:block">
            <TableSkeleton rows={6} columns={5} />
          </div>
          <div className="sm:hidden">
            <CardListSkeleton rows={5} showAvatar={false} />
          </div>
        </>
      ) : filtered.length === 0 ? (
        <Card>
          {useApiCatalog && inventoryFetchError ? (
            <EmptyState
              icon={<AlertTriangle size={28} />}
              title="Unable to load inventory"
              description={inventoryFetchError}
              action={
                <Button variant="primary" size="sm" disabled={catalogLoading} onClick={() => void refreshInventory()}>
                  Try again
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Package size={28} />}
              title="No items in your inventory yet"
              description="Add your first item to start billing. You can also bulk-import from a CSV later."
              action={<Button variant="primary" icon={<Plus size={14} />} onClick={openAdd}>Add first item</Button>}
            />
          ) : (
            <EmptyState
              icon={<PackageX size={28} />}
              title="No items match your filters"
              description="Try a different search term, category, stock status, or added date."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('');
                    setStockFilter('');
                    setAddedFilter('');
                    setAddedFrom('');
                    setAddedTo('');
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <div className="animate-fade-in-up">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table
              columns={[
                {
                  key: 'select',
                  header: <Checkbox checked={allPageSelected} indeterminate={somePageSelected && !allPageSelected} onChange={toggleSelectAll} />,
                  className: 'w-10',
                  render: (i: InventoryItem) => (
                    <span onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(i.id)} onChange={() => toggleSelect(i.id)} />
                    </span>
                  ),
                },
                {
                  key: 'item',
                  header: 'Item',
                  sortable: true,
                  render: (i: InventoryItem) => (
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Highlight text={i.category} query={searchForFilter} />
                        {i.sku && (
                          <span className="font-mono text-gray-400">
                            · <Highlight text={i.sku} query={searchForFilter} />
                          </span>
                        )}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        <Highlight text={i.name} query={searchForFilter} />
                      </p>
                      {supplierIdLabel(i.supplierId) && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          via {supplierIdLabel(i.supplierId)}
                        </p>
                      )}
                      {i.rackLocation && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400">📍 {i.rackLocation}</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'cost',
                  header: 'Cost price',
                  sortable: !cpSec.isCostHidden,
                  render: (i: InventoryItem) => cpSec.isCostHidden
                    ? <span className="inline-flex items-center gap-1 text-gray-400"><Lock size={11} /> ••••••</span>
                    : <span className="tabular-nums text-gray-500">{i.costPrice ? formatCurrency(i.costPrice) : '—'}</span>,
                  className: 'text-right',
                },
                {
                  key: 'mrp',
                  header: 'MRP',
                  sortable: true,
                  render: (i: InventoryItem) => {
                    const mrp = i.mrp ?? i.price;
                    return <span className="tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(mrp)}</span>;
                  },
                  className: 'text-right',
                },
                {
                  key: 'discount',
                  header: 'Suggested Discount',
                  sortable: true,
                  render: (i: InventoryItem) => {
                    const d = i.discountPercent ?? 0;
                    if (!d) return <span className="text-xs text-gray-400">—</span>;
                    return <Badge variant="success">{d}% off</Badge>;
                  },
                  className: 'text-right',
                },
                {
                  key: 'stock',
                  header: 'Stock',
                  sortable: true,
                  render: (i: InventoryItem) => <StockPill item={i} />,
                },
                {
                  key: 'value',
                  header: 'Value',
                  sortable: true,
                  render: (i: InventoryItem) => <span className="tabular-nums text-gray-500">{formatCurrency(i.price * i.stock)}</span>,
                  className: 'text-right',
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right w-52',
                  render: (i: InventoryItem) => (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" icon={<Eye size={13} />} onClick={() => openView(i)}>View</Button>
                      {canEdit && (
                        <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(i)}>Edit</Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(i.id, i.name)}>Del</Button>
                      )}
                    </div>
                  ),
                },
              ].filter(col => !(isStaff && col.key === 'cost'))}
              data={visible}
              keyExtractor={i => i.id}
              sortState={sortState}
              onSort={toggleSort}
            />
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 sm:hidden">
            {visible.map(i => (
              <li key={i.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover-lift transition-transform">
                <div className="flex items-start justify-between gap-3">
                  <span className="mt-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(i.id)} onChange={() => toggleSelect(i.id)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Highlight text={i.category} query={searchForFilter} />
                      {i.sku && (
                        <span className="font-mono text-gray-400 truncate">
                          · <Highlight text={i.sku} query={searchForFilter} />
                        </span>
                      )}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      <Highlight text={i.name} query={searchForFilter} />
                    </p>
                    <p className="text-xs text-gray-500 tabular-nums mt-0.5">
                      {!isStaff && (cpSec.isCostHidden
                        ? <span className="inline-flex items-center gap-1"><Lock size={10} /> ••••••</span>
                        : (i.costPrice ? <>Cost: {formatCurrency(i.costPrice)}</> : 'Cost: —'))}
                      {(i.discountPercent ?? 0) > 0 && (
                        <span className={`${isStaff ? '' : 'ml-1.5 '}text-emerald-600 dark:text-emerald-400`}>{!isStaff && '· '}{i.discountPercent}% off</span>
                      )}
                    </p>
                    {i.rackLocation && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">📍 {i.rackLocation}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">MRP</p>
                    <span className="tabular-nums text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(i.mrp ?? i.price)}</span>
                    <div className="mt-1"><StockPill item={i} /></div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-gray-200 dark:border-gray-800 pt-3">
                  <Button variant="ghost" size="sm" icon={<Eye size={13} />} onClick={() => openView(i)} className="flex-1">View</Button>
                  {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(i)} className="flex-1">Edit</Button>}
                  {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(i.id, i.name)} className="flex-1">Delete</Button>}
                </div>
              </li>
            ))}
          </ul>

          {/* Infinite-scroll sentinel + footer */}
          <div ref={sentinelRef} className="h-8" />
          {sorted.length > 0 && (
            <p className="text-center text-[11px] text-gray-400 mt-1 mb-2 tabular-nums">
              {visible.length < sorted.length
                ? `Showing ${visible.length} of ${sorted.length} — scroll for more`
                : `${sorted.length} item${sorted.length === 1 ? '' : 's'}`}
            </p>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit item' : 'Add item'} size="lg">
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Input label="Item name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engine Oil 5W-30" />

          <div className={`grid ${isStaff ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-4`}>
            {!isStaff && (cpSec.enabled && cpSec.codedInputEnabled ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost price (coded)</label>
                <div className="flex gap-1.5">
                  <input
                    value={costCodeInput}
                    onChange={e => {
                      const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                      setCostCodeInput(v);
                      const decoded = cpSec.decodePrice(v);
                      if (decoded != null) setForm(f => ({ ...f, costPrice: decoded }));
                    }}
                    placeholder={`e.g. ${cpSec.encodePrice(540)}`}
                    className="flex-1 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono tracking-widest"
                  />
                </div>
                {costCodeInput && cpSec.decodePrice(costCodeInput) != null && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Decoded: ₹{cpSec.decodePrice(costCodeInput)!.toLocaleString('en-IN')}</p>
                )}
                {costCodeInput && cpSec.decodePrice(costCodeInput) == null && (
                  <p className="text-[11px] text-red-500">Invalid code</p>
                )}
              </div>
            ) : cpSec.isCostHidden ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost price (₹)</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Lock size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-400 tracking-widest">••••••</span>
                </div>
                <button type="button" onClick={() => setCpPinModalOpen(true)} className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline text-left">Enter PIN to edit</button>
              </div>
            ) : (
              <Input label="Cost price (₹)" type="number" value={form.costPrice || ''} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })} placeholder="0" />
            ))}
            <Input label="MRP (₹) *" type="number" value={form.mrp || ''} onChange={e => setForm({ ...form, mrp: Number(e.target.value) })} placeholder="0" />
            <Input
              label="Suggested Discount (%)"
              type="number"
              value={form.discountPercent || ''}
              onChange={e => {
                const v = Number(e.target.value);
                setForm({ ...form, discountPercent: Math.max(0, Math.min(100, isNaN(v) ? 0 : v)) });
              }}
              placeholder="0"
            />
          </div>
          {(form.mrp ?? 0) > 0 && (form.discountPercent ?? 0) > 0 && (
            <div className="-mt-2 text-xs text-gray-500">
              Sells at{' '}
              <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatCurrency(computeSellPrice(form.mrp, form.discountPercent))}
              </span>
              <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">
                ({form.discountPercent}% off MRP)
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock *" type="number" value={form.stock || ''} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
            <Input label="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g. piece, bottle, set" />
          </div>

          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Dropdown label="Category *" options={categoryFormOptions} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <Button variant="secondary" size="sm" type="button" icon={<Plus size={14} />} onClick={() => setAddingCategory(true)} className="shrink-0 mb-px">
                New
              </Button>
            </div>
            {addingCategory && (
              <div className="mt-2 flex items-end gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <Input
                    label="New category"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="e.g. Suspension"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-1 shrink-0 mb-px">
                  <Button variant="primary" size="sm" type="button" onClick={handleAddCategory}>Add</Button>
                  <Button variant="ghost" size="sm" type="button" onClick={() => { setAddingCategory(false); setNewCategory(''); }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          {/* Advanced fields drawer */}
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-500" />
              Advanced fields
              <span className="text-xs text-gray-400 font-normal">SKU, Barcode, HSN, Tax, Reorder, Supplier, Expiry, Rack</span>
            </span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-2 gap-4">
                <Input label="SKU" value={form.sku ?? ''} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. OIL-5W30-1L" />
                <Input label="Barcode" value={form.barcode ?? ''} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="EAN-13 or any code" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={
                    <>HSN code <JargonHint term="hsn" /></>
                  }
                  value={form.hsn ?? ''}
                  onChange={e => setForm({ ...form, hsn: e.target.value })}
                  placeholder="8-digit code"
                />
                <Input label="Tax rate (%)" type="number" value={form.taxRate ?? ''} onChange={e => setForm({ ...form, taxRate: Number(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Reorder level" type="number" value={form.reorderLevel ?? ''} onChange={e => setForm({ ...form, reorderLevel: Number(e.target.value) })} />
                <div>
                  <Input
                    label="Supplier ID"
                    value={form.supplierId ?? ''}
                    onChange={e =>
                      setForm({ ...form, supplierId: e.target.value.slice(0, 64) })
                    }
                    list="inventory-supplier-ids"
                    placeholder="Code or ID (matches server, max 64 chars)"
                  />
                  <datalist id="inventory-supplier-ids">
                    {supplierIdSuggestions.map(v => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Optional. Suggestions are IDs already used on items. Enter any supplier code your shop uses — there is no global supplier list on the server yet.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Expiry date" type="date" value={form.expiryDate ?? ''} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                <Input label="Batch / Lot No." value={form.batchNo ?? ''} onChange={e => setForm({ ...form, batchNo: e.target.value })} placeholder="optional" />
              </div>
              <Input
                label="Rack Location"
                value={form.rackLocation ?? ''}
                onChange={e => setForm(f => ({ ...f, rackLocation: e.target.value }))}
                placeholder="e.g. A1-03"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={savePending}>{editing ? 'Save changes' : 'Add item'}</Button>
          </div>
        </form>
      </Modal>

      {/* View Item Modal */}
      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Item Details" size="lg">
        {viewItem && (() => {
          const mrp = viewItem.mrp ?? viewItem.price;
          const disc = viewItem.discountPercent ?? 0;
          const sellPrice = computeSellPrice(mrp, disc);
          const margin = calcMargin(viewItem.costPrice, sellPrice);
          const stockVal = viewItem.price * viewItem.stock;
          const supplier = supplierIdLabel(viewItem.supplierId);

          return (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500">{viewItem.category}{viewItem.sku ? ` · ${viewItem.sku}` : ''}</p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{viewItem.name}</h3>
                  {supplier && <p className="text-xs text-gray-400 mt-0.5">via {supplier}</p>}
                </div>
                <StockPill item={viewItem} />
              </div>

              {/* Pricing grid */}
              <div className={`grid grid-cols-2 ${isStaff ? '' : 'sm:grid-cols-4'} gap-3`}>
                {!isStaff && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Cost Price</p>
                    {cpSec.isCostHidden ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-400"><Lock size={13} /> ••••••</span>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{viewItem.costPrice ? formatCurrency(viewItem.costPrice) : '—'}</p>
                    )}
                  </div>
                )}
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">MRP</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(mrp)}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Sell Price</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(sellPrice)}</p>
                  {disc > 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{disc}% off MRP</p>}
                </div>
                {!isStaff && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Margin</p>
                    {cpSec.isCostHidden ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-400"><Lock size={13} /> ••••••</span>
                    ) : (
                      <p className={`text-sm font-semibold tabular-nums ${margin != null && margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {margin != null ? `${margin.toFixed(1)}%` : '—'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Stock & value */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Stock</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{viewItem.stock} {viewItem.unit}{viewItem.stock === 1 ? '' : 's'}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Reorder at: {viewItem.reorderLevel ?? DEFAULT_REORDER}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Stock Value</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(stockVal)}</p>
                </div>
              </div>

              {/* Additional details */}
              {(viewItem.barcode || viewItem.hsn || viewItem.taxRate || viewItem.batchNo || viewItem.expiryDate || viewItem.rackLocation) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm px-1">
                  {viewItem.barcode && (
                    <div>
                      <span className="text-gray-500 text-xs">Barcode:</span>
                      <p className="font-mono text-gray-900 dark:text-white">{viewItem.barcode}</p>
                    </div>
                  )}
                  {viewItem.hsn && (
                    <div>
                      <span className="text-gray-500 text-xs">HSN:</span>
                      <p className="font-mono text-gray-900 dark:text-white">{viewItem.hsn}</p>
                    </div>
                  )}
                  {viewItem.taxRate != null && (
                    <div>
                      <span className="text-gray-500 text-xs">Tax Rate:</span>
                      <p className="text-gray-900 dark:text-white">{viewItem.taxRate}%</p>
                    </div>
                  )}
                  {viewItem.batchNo && (
                    <div>
                      <span className="text-gray-500 text-xs">Batch:</span>
                      <p className="text-gray-900 dark:text-white">{viewItem.batchNo}</p>
                    </div>
                  )}
                  {viewItem.expiryDate && (
                    <div>
                      <span className="text-gray-500 text-xs">Expiry:</span>
                      <p className="text-gray-900 dark:text-white">{viewItem.expiryDate}</p>
                    </div>
                  )}
                  {viewItem.rackLocation && (
                    <div>
                      <span className="text-gray-500 text-xs">Rack Location:</span>
                      <p className="text-amber-600 dark:text-amber-400">{viewItem.rackLocation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Cost price reveal for this modal */}
              {!isStaff && cpSec.enabled && cpSec.isCostHidden && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                  <Lock size={14} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-purple-700 dark:text-purple-300 flex-1">Cost price and margin are protected</span>
                  <Button variant="secondary" size="sm" onClick={() => setCpPinModalOpen(true)}>Enter PIN</Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {canEdit && (
                  <Button variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => { setViewModalOpen(false); openEdit(viewItem); }}>
                    Edit
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setViewModalOpen(false)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Bulk import modal */}
      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={async rows => {
          setImportBusy(true);
          try {
            const result = await bulkImportInventoryItems(rows);
            if (!result.ok) {
              addToast('error', 'Import failed', result.error);
              return;
            }
            const imported = result.data;
            addToast('success', `${imported.length} item${imported.length === 1 ? '' : 's'} imported`);
            setImportOpen(false);
          } finally {
            setImportBusy(false);
          }
        }}
        importBusy={importBusy}
      />

      {/* PIN verification modal */}
      <Modal open={cpPinModalOpen} onClose={() => { setCpPinModalOpen(false); setCpPinInput(''); }} title="Reveal Cost Prices" size="sm">
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            if (cpSec.verifyPin(cpPinInput)) {
              cpSec.reveal();
              setCpPinModalOpen(false);
              setCpPinInput('');
              addToast('success', 'Cost prices revealed for this session');
            } else {
              addToast('error', 'Incorrect PIN');
              setCpPinInput('');
            }
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Lock size={24} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Enter admin PIN to view cost prices</p>
          </div>
          <Input
            label="Admin PIN"
            type="password"
            value={cpPinInput}
            onChange={e => setCpPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter PIN"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => { setCpPinModalOpen(false); setCpPinInput(''); }}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={cpPinInput.length < 4}>Verify & Reveal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

interface ParsedRow {
  raw: Record<string, string>;
  data: Omit<InventoryItem, 'id'>;
  errors: string[];
  rowNum: number;
}

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: Omit<InventoryItem, 'id'>[]) => void | Promise<void>;
  /** Disables import button while API request runs */
  importBusy?: boolean;
}

const REQUIRED_HEADERS = ['name', 'price', 'stock', 'category'];
const ALL_HEADERS = ['name', 'sku', 'barcode', 'category', 'unit', 'costPrice', 'price', 'stock', 'reorderLevel', 'hsn', 'taxRate', 'supplierId', 'rackLocation'];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuote) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQuote = false; }
        else { cur += ch; }
      } else {
        if (ch === ',') { out.push(cur); cur = ''; }
        else if (ch === '"') { inQuote = true; }
        else { cur += ch; }
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  };

  const headers = splitLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

function BulkImportModal({ open, onClose, onImport, importBusy = false }: BulkImportModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [unknownHeaders, setUnknownHeaders] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const { addToast } = useToast();

  const reset = () => {
    setFileName(null);
    setParsed(null);
    setHeaderError(null);
    setUnknownHeaders([]);
    setShowOnlyErrors(false);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      addToast('error', 'Please upload a .csv file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'File too large (max 5 MB)');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = String(e.target?.result ?? '');
      const { headers, rows } = parseCSV(text);

      const lower = headers.map(h => h.toLowerCase());
      const missing = REQUIRED_HEADERS.filter(h => !lower.includes(h.toLowerCase()));
      if (missing.length > 0) {
        setHeaderError(`Missing required column${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}`);
        setParsed([]);
        setUnknownHeaders([]);
        return;
      }
      setHeaderError(null);
      setUnknownHeaders(headers.filter(h => !ALL_HEADERS.some(a => a.toLowerCase() === h.toLowerCase())));

      const idx = (h: string) => lower.indexOf(h.toLowerCase());

      const parsedRows: ParsedRow[] = rows.map((cells, i) => {
        const get = (h: string) => { const k = idx(h); return k >= 0 ? (cells[k] ?? '').trim() : ''; };
        const raw: Record<string, string> = {};
        headers.forEach((h, k) => { raw[h] = (cells[k] ?? '').trim(); });

        const errors: string[] = [];
        const name = get('name');
        const price = Number(get('price'));
        const stock = Number(get('stock'));
        const costPrice = get('costPrice') ? Number(get('costPrice')) : 0;
        const taxRate = get('taxRate') ? Number(get('taxRate')) : DEFAULT_TAX_RATE;
        const reorderLevel = get('reorderLevel') ? Number(get('reorderLevel')) : DEFAULT_REORDER;
        const supplierId = get('supplierId') || undefined;

        if (!name) errors.push('name required');
        if (!get('category')) errors.push('category required');
        if (Number.isNaN(price) || price <= 0) errors.push('price invalid');
        if (Number.isNaN(stock) || stock < 0) errors.push('stock invalid');
        if (costPrice && costPrice > price) errors.push('cost > price');
        if (Number.isNaN(taxRate)) errors.push('taxRate invalid');
        if (Number.isNaN(reorderLevel)) errors.push('reorderLevel invalid');
        if (supplierId && supplierId.length > 64) errors.push('supplierId max 64 characters');

        return {
          raw,
          rowNum: i + 2,
          errors,
          data: {
            name,
            category: get('category'),
            unit: get('unit') || 'piece',
            sku: get('sku') || undefined,
            barcode: get('barcode') || undefined,
            costPrice,
            price,
            stock,
            reorderLevel,
            hsn: get('hsn') || undefined,
            taxRate,
            supplierId,
            rackLocation: get('rackLocation') || undefined,
          },
        };
      });
      setParsed(parsedRows);
    };
    reader.onerror = () => addToast('error', 'Failed to read file');
    reader.readAsText(file);
  };

  const validRows = parsed?.filter(r => r.errors.length === 0) ?? [];
  const errorRows = parsed?.filter(r => r.errors.length > 0) ?? [];
  const visibleRows = showOnlyErrors ? errorRows : (parsed ?? []);

  const handleImport = () => {
    if (!parsed || validRows.length === 0) return;
    void onImport(validRows.map(r => r.data));
  };

  const downloadTemplate = () => {
    const tpl = 'name,sku,barcode,category,unit,costPrice,price,stock,reorderLevel,hsn,taxRate,supplierId\n' +
                'Sample Item,SKU-001,8901234567899,Oils,bottle,200,300,50,10,27101981,18,S1';
    const blob = new Blob([tpl], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={onClose} title="Bulk import inventory" size="lg">
      <form
        className="space-y-4"
        onSubmit={e => {
          e.preventDefault();
          handleImport();
        }}
      >
        {!parsed && !headerError && (
          <>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Upload a CSV with these columns. <strong>Required:</strong> name, category, price, stock.
              <div className="mt-2 flex flex-wrap gap-1">
                {ALL_HEADERS.map(h => (
                  <code key={h} className={`text-[11px] rounded px-1.5 py-0.5 ${REQUIRED_HEADERS.includes(h) ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{h}{REQUIRED_HEADERS.includes(h) && ' *'}</code>
                ))}
              </div>
            </div>
            <button type="button" onClick={downloadTemplate} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
              ↓ Download CSV template
            </button>
          </>
        )}

        {!parsed && (
          <label
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={e => {
              e.preventDefault();
              setDragActive(false);
              handleFile(e.dataTransfer.files[0] ?? null);
            }}
            className={`flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 scale-[1.01]'
                : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800/40'
            }`}
          >
            <Upload size={32} className={dragActive ? 'text-emerald-500' : 'text-gray-400'} />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {dragActive ? 'Drop to upload' : 'Drag CSV here or click to browse'}
            </p>
            <p className="text-xs text-gray-500">.csv · max 5 MB</p>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        {headerError && (
          <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">Cannot parse {fileName}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{headerError}</p>
              </div>
            </div>
            <div className="mt-3">
              <Button variant="secondary" size="sm" type="button" onClick={reset}>Try another file</Button>
            </div>
          </div>
        )}

        {parsed && parsed.length > 0 && !headerError && (
          <>
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-900 dark:text-white">{fileName}</span>
                <span className="text-gray-400">·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{validRows.length} valid</span>
                {errorRows.length > 0 && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="text-red-700 dark:text-red-400 font-medium">{errorRows.length} with errors</span>
                  </>
                )}
              </div>
              <div className="flex-1" />
              {errorRows.length > 0 && (
                <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={showOnlyErrors} onChange={e => setShowOnlyErrors(e.target.checked)} className="rounded" />
                  Show errors only
                </label>
              )}
              <Button variant="ghost" size="sm" type="button" onClick={reset}>Clear</Button>
            </div>

            {unknownHeaders.length > 0 && (
              <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded p-2">
                Unknown columns ignored: <code>{unknownHeaders.join(', ')}</code>
              </div>
            )}

            <div className="max-h-[360px] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr className="text-gray-500">
                    <th className="text-left px-2 py-2 font-medium">#</th>
                    <th className="text-left px-2 py-2 font-medium">Status</th>
                    <th className="text-left px-2 py-2 font-medium">Name</th>
                    <th className="text-left px-2 py-2 font-medium">SKU</th>
                    <th className="text-left px-2 py-2 font-medium">Category</th>
                    <th className="text-right px-2 py-2 font-medium">Cost</th>
                    <th className="text-right px-2 py-2 font-medium">Price</th>
                    <th className="text-right px-2 py-2 font-medium">Stock</th>
                    <th className="text-left px-2 py-2 font-medium">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {visibleRows.map(r => (
                    <tr key={r.rowNum} className={r.errors.length > 0 ? 'bg-red-50/40 dark:bg-red-500/5' : ''}>
                      <td className="px-2 py-1.5 text-gray-500 tabular-nums">{r.rowNum}</td>
                      <td className="px-2 py-1.5">
                        {r.errors.length === 0
                          ? <Badge variant="success">OK</Badge>
                          : <Badge variant="danger">Skip</Badge>}
                      </td>
                      <td className="px-2 py-1.5 text-gray-900 dark:text-white font-medium truncate max-w-[160px]">{r.data.name || <span className="text-gray-400 italic">missing</span>}</td>
                      <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400 font-mono">{r.data.sku || '—'}</td>
                      <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">{r.data.category || '—'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.data.costPrice ? formatCurrency(r.data.costPrice) : '—'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number.isFinite(r.data.price) ? formatCurrency(r.data.price) : '—'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number.isFinite(r.data.stock) ? r.data.stock : '—'}</td>
                      <td className="px-2 py-1.5 text-red-600 dark:text-red-400">{r.errors.join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500">
            {parsed ? (validRows.length > 0 ? `Importing valid rows only.${errorRows.length > 0 ? ' Error rows will be skipped.' : ''}` : 'No valid rows to import.') : 'Drag-drop or browse to load a CSV file.'}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={importBusy || !parsed || validRows.length === 0}>
              Import {validRows.length > 0 ? validRows.length : ''} {validRows.length === 1 ? 'item' : 'items'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

