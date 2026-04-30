import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  PackageX,
  AlertTriangle,
  Package,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Upload,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExportMenu } from '../../components/ui/ExportMenu';
import { CardListSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { Toggle } from '../../components/ui/Toggle';
import { JargonHint } from '../../components/ui/JargonHint';
import { inventoryItems as initialItems, suppliers, bills } from '../../data/shop-dummy';
import { formatCurrency, generateId } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { usePagination } from '../../hooks/usePagination';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import type { InventoryItem } from '../../types';
import type { ExportColumn } from '../../utils/exporters';

const DEFAULT_CATEGORIES = Array.from(new Set(initialItems.map(i => i.category))).sort();
const DEFAULT_TAX_RATE = 18;
const DEFAULT_REORDER = 10;

const emptyItem: Omit<InventoryItem, 'id'> = {
  name: '',
  price: 0,
  stock: 0,
  category: '',
  unit: 'piece',
  costPrice: 0,
  sku: '',
  barcode: '',
  reorderLevel: DEFAULT_REORDER,
  supplierId: '',
  hsn: '',
  taxRate: DEFAULT_TAX_RATE,
  expiryDate: '',
  batchNo: '',
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

const lastSoldMap = (() => {
  const map = new Map<string, string>();
  bills.forEach(b => {
    b.items.forEach(it => {
      const prev = map.get(it.id);
      if (!prev || b.date > prev) map.set(it.id, b.date);
    });
  });
  return map;
})();

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

function MarginBadge({ cost, price }: { cost?: number; price: number }) {
  const m = calcMargin(cost, price);
  if (m == null) return <span className="text-xs text-gray-400">—</span>;
  const tone = m >= 30 ? 'success' : m >= 15 ? 'warning' : 'danger';
  return <Badge variant={tone}>{m.toFixed(0)}%</Badge>;
}

type StockFilter = '' | 'low' | 'out';

export function ShopInventory() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<Omit<InventoryItem, 'id'>>(emptyItem);
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { can } = usePermissions();
  const { track } = useRecentlyViewed();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const canAdd = can('inventory', 'add');
  const canEdit = can('inventory', 'edit');
  const canDelete = can('inventory', 'delete');

  const supplierOptions = useMemo(() => [
    { label: '— None —', value: '' },
    ...suppliers.map(s => ({ label: s.name, value: s.id })),
  ], []);

  const allCategories = useMemo(() =>
    Array.from(new Set([...categories, ...items.map(i => i.category)])).sort(),
    [items, categories]
  );

  const categoryFormOptions = useMemo(() => [
    { label: 'Select category', value: '' },
    ...allCategories.map(c => ({ label: c, value: c })),
  ], [allCategories]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
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
      return matchesSearch && matchesCat && matchesStock;
    });
  }, [items, search, categoryFilter, stockFilter]);

  const pagination = usePagination({
    data: filtered,
    pageSize: 10,
    sortFns: {
      item: (a, b) => a.name.localeCompare(b.name),
      price: (a, b) => a.price - b.price,
      stock: (a, b) => a.stock - b.stock,
      margin: (a, b) => (calcMargin(a.costPrice, a.price) ?? -1) - (calcMargin(b.costPrice, b.price) ?? -1),
    },
  });

  const totalValue = useMemo(() => items.reduce((s, i) => s + i.price * i.stock, 0), [items]);
  const lowStockCount = useMemo(() => items.filter(isLowStock).length, [items]);
  const outOfStockCount = useMemo(() => items.filter(i => i.stock === 0).length, [items]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyItem);
    setAddingCategory(false);
    setNewCategory('');
    setShowAdvanced(false);
    setModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      price: item.price,
      stock: item.stock,
      category: item.category,
      unit: item.unit,
      costPrice: item.costPrice ?? 0,
      sku: item.sku ?? '',
      barcode: item.barcode ?? '',
      reorderLevel: item.reorderLevel ?? DEFAULT_REORDER,
      supplierId: item.supplierId ?? '',
      hsn: item.hsn ?? '',
      taxRate: item.taxRate ?? DEFAULT_TAX_RATE,
      expiryDate: item.expiryDate ?? '',
      batchNo: item.batchNo ?? '',
    });
    setAddingCategory(false);
    setNewCategory('');
    setShowAdvanced(Boolean(item.sku || item.barcode || item.hsn || item.supplierId));
    setModalOpen(true);
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
    if (categories.includes(trimmed)) { addToast('warning', 'Category already exists'); return; }
    setCategories(prev => [...prev, trimmed].sort());
    setForm(f => ({ ...f, category: trimmed }));
    setNewCategory('');
    setAddingCategory(false);
    addToast('success', `Category "${trimmed}" added`);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.category.trim()) {
      addToast('error', 'Please fill required fields');
      return;
    }
    if (form.costPrice && form.price && form.costPrice > form.price) {
      addToast('warning', 'Cost is higher than sell price — margin will be negative');
    }
    if (editing) {
      setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...form } : i));
      addToast('success', 'Item updated');
    } else {
      setItems(prev => [...prev, { id: generateId(), ...form }]);
      addToast('success', 'Item added');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setItems(prev => prev.filter(i => i.id !== id));
    addToast('success', 'Item deleted');
  };

  const margin = calcMargin(form.costPrice, form.price);
  const supplierName = (id?: string) => suppliers.find(s => s.id === id)?.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Manage items, prices, costs and stock levels.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportMenu<InventoryItem>
            baseName="inventory"
            title="Inventory export"
            meta={`${filtered.length} of ${items.length} items`}
            columns={INVENTORY_EXPORT_COLUMNS}
            rows={filtered}
            size="md"
          />
          {canAdd && <Button variant="secondary" icon={<Upload size={16} />} onClick={() => setImportOpen(true)}>Bulk import</Button>}
          {canAdd && <Button variant="primary" icon={<Plus size={16} />} onClick={openAdd}>Add item</Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Items" value={String(items.length)} icon={<Package size={18} />} />
        <StatCard title="Stock Value" value={formatCurrency(totalValue)} icon={<TrendingUp size={18} />} />
        <StatCard
          title="Below Reorder"
          value={String(lowStockCount)}
          icon={<AlertTriangle size={18} />}
          trend={lowStockCount > 0 ? 'Action needed' : 'All good'}
          trendUp={lowStockCount === 0}
          onClick={() => { setStockFilter('low'); setCategoryFilter(''); }}
        />
        <StatCard
          title="Out of Stock"
          value={String(outOfStockCount)}
          icon={<PackageX size={18} />}
          trend={outOfStockCount > 0 ? 'Reorder now' : 'All stocked'}
          trendUp={outOfStockCount === 0}
          onClick={() => { setStockFilter('out'); setCategoryFilter(''); }}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <SearchInput placeholder="Search by name, SKU, barcode, HSN..." value={search} onSearch={setSearch} className="flex-1" />
            <div className="flex items-center gap-2 shrink-0">
              <Toggle checked={showCost} onChange={setShowCost} />
              <span className="text-xs text-gray-500">Show cost & margin</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setCategoryFilter(''); setStockFilter(''); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !categoryFilter && !stockFilter ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/50' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => { setStockFilter('low'); setCategoryFilter(''); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                stockFilter === 'low' ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              ⚠ Below reorder ({lowStockCount})
            </button>
            <button
              onClick={() => { setStockFilter('out'); setCategoryFilter(''); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                stockFilter === 'out' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              ✗ Out of stock ({outOfStockCount})
            </button>
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 self-center" />
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setStockFilter(''); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  categoryFilter === cat ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
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
          {items.length === 0 ? (
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
              description="Try a different search term, category, or stock status."
              action={<Button variant="secondary" size="sm" onClick={() => { setSearch(''); setCategoryFilter(''); setStockFilter(''); }}>Clear filters</Button>}
            />
          )}
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table
              columns={[
                {
                  key: 'item',
                  header: 'Item',
                  sortable: true,
                  render: i => (
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        {i.category}
                        {i.sku && <span className="font-mono text-gray-400">· {i.sku}</span>}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{i.name}</p>
                      {i.supplierId && (
                        <p className="text-[11px] text-gray-400 mt-0.5">via {supplierName(i.supplierId)}</p>
                      )}
                    </div>
                  ),
                },
                ...(showCost ? [{
                  key: 'cost',
                  header: 'Cost',
                  render: (i: InventoryItem) => <span className="tabular-nums text-gray-500">{i.costPrice ? formatCurrency(i.costPrice) : '—'}</span>,
                  className: 'text-right',
                }] : []),
                {
                  key: 'price',
                  header: 'Sell price',
                  sortable: true,
                  render: (i: InventoryItem) => <span className="tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(i.price)}</span>,
                  className: 'text-right',
                },
                ...(showCost ? [{
                  key: 'margin',
                  header: 'Margin',
                  sortable: true,
                  render: (i: InventoryItem) => <MarginBadge cost={i.costPrice} price={i.price} />,
                  className: 'text-right',
                }] : []),
                {
                  key: 'stock',
                  header: 'Stock',
                  sortable: true,
                  render: (i: InventoryItem) => <StockPill item={i} />,
                },
                {
                  key: 'value',
                  header: 'Value',
                  render: (i: InventoryItem) => <span className="tabular-nums text-gray-500">{formatCurrency(i.price * i.stock)}</span>,
                  className: 'text-right',
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right w-40',
                  render: (i: InventoryItem) => (
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(i)}>Edit</Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(i.id, i.name)}>Del</Button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={pagination.pageData}
              keyExtractor={i => i.id}
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={pagination.setPage}
              sortState={pagination.sortState}
              onSort={pagination.toggleSort}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
            />
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 sm:hidden">
            {pagination.pageData.map(i => (
              <li key={i.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      {i.category}
                      {i.sku && <span className="font-mono text-gray-400 truncate">· {i.sku}</span>}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{i.name}</p>
                    <p className="text-xs text-gray-500 tabular-nums mt-0.5">Value: {formatCurrency(i.price * i.stock)}</p>
                    {showCost && i.costPrice ? (
                      <p className="text-xs text-gray-500 tabular-nums mt-0.5">Cost: {formatCurrency(i.costPrice)} · Margin <MarginBadge cost={i.costPrice} price={i.price} /></p>
                    ) : null}
                    {lastSoldMap.get(i.id) && (
                      <p className="text-[11px] text-gray-400 mt-0.5">Last sold: {lastSoldMap.get(i.id)}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="tabular-nums text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(i.price)}</span>
                    <div className="mt-1"><StockPill item={i} /></div>
                  </div>
                </div>
                {(canEdit || canDelete) && (
                  <div className="mt-3 flex gap-2 border-t border-gray-200 dark:border-gray-800 pt-3">
                    {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(i)} className="flex-1">Edit</Button>}
                    {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(i.id, i.name)} className="flex-1">Delete</Button>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit item' : 'Add item'} size="lg">
        <div className="space-y-4">
          <Input label="Item name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engine Oil 5W-30" />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Input label="Cost price (₹)" type="number" value={form.costPrice || ''} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })} placeholder="0" />
            <Input label="Sell price (₹) *" type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Margin <JargonHint term="margin" />
              </label>
              <div className={`h-10 rounded-lg border px-3 flex items-center text-sm font-semibold tabular-nums ${
                margin == null ? 'text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                : margin >= 30 ? 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                : margin >= 15 ? 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10'
                : 'text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-500/30 dark:bg-red-500/10'
              }`}>
                {margin == null ? '—' : `${margin.toFixed(1)}%`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock *" type="number" value={form.stock || ''} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
            <Input label="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g. piece, bottle, set" />
          </div>

          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Dropdown label="Category *" options={categoryFormOptions} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setAddingCategory(true)} className="shrink-0 mb-px">
                New
              </Button>
            </div>
            {addingCategory && (
              <div className="mt-2 flex items-end gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <Input label="New category" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Suspension" />
                </div>
                <div className="flex gap-1 shrink-0 mb-px">
                  <Button variant="primary" size="sm" onClick={handleAddCategory}>Add</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setAddingCategory(false); setNewCategory(''); }}>Cancel</Button>
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
              <span className="text-xs text-gray-400 font-normal">SKU, Barcode, HSN, Tax, Reorder, Supplier, Expiry</span>
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
                <Dropdown label="Supplier" options={supplierOptions} value={form.supplierId ?? ''} onChange={e => setForm({ ...form, supplierId: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Expiry date" type="date" value={form.expiryDate ?? ''} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                <Input label="Batch / Lot No." value={form.batchNo ?? ''} onChange={e => setForm({ ...form, batchNo: e.target.value })} placeholder="optional" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? 'Save changes' : 'Add item'}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk import modal */}
      <BulkImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
}

function BulkImportModal({ open, onClose }: BulkImportModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { addToast } = useToast();

  const handleFile = (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    const fakeRows = Math.floor(Math.random() * 30) + 5;
    setParsedCount(fakeRows);
  };

  const handleImport = () => {
    if (!fileName) return;
    addToast('success', `${parsedCount} rows queued for import`);
    setFileName(null);
    setParsedCount(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Bulk import inventory" size="md">
      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Upload a CSV with these headers: <code className="text-xs bg-gray-100 dark:bg-gray-800 rounded px-1">name, sku, barcode, category, unit, costPrice, price, stock, reorderLevel, hsn, taxRate, supplierId</code>
        </div>
        <button
          type="button"
          onClick={() => {
            const tpl = 'name,sku,barcode,category,unit,costPrice,price,stock,reorderLevel,hsn,taxRate,supplierId\n' +
                        'Sample Item,SKU-001,8901234567899,Oils,bottle,200,300,50,10,27101981,18,S1';
            const blob = new Blob([tpl], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'inventory-template.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          ↓ Download CSV template
        </button>

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
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800/40'
          }`}
        >
          <Upload size={28} className="text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {fileName ? fileName : 'Drag CSV here or click to browse'}
          </p>
          {parsedCount != null && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              ✓ Parsed {parsedCount} rows · ready to import
            </p>
          )}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="text-xs text-gray-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3 text-amber-800 dark:text-amber-400">
          <strong>Note:</strong> CSV import is currently in preview. Items will be queued and reviewed before they hit live inventory.
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleImport} disabled={!fileName}>Import {parsedCount ?? ''} rows</Button>
        </div>
      </div>
    </Modal>
  );
}
