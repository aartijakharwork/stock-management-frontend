import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, PackageX, AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { EmptyState } from '../../components/ui/EmptyState';
import { inventoryItems as initialItems } from '../../data/shop-dummy';
import { formatCurrency, generateId } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { usePagination } from '../../hooks/usePagination';
import type { InventoryItem } from '../../types';

const DEFAULT_CATEGORIES = Array.from(new Set(initialItems.map(i => i.category))).sort();
const emptyItem: Omit<InventoryItem, 'id'> = { name: '', price: 0, stock: 0, category: '', unit: 'piece' };

function StockPill({ stock, unit }: { stock: number; unit: string }) {
  const label = `${stock} ${unit}${stock === 1 ? '' : 's'}`;
  if (stock === 0) return <Badge variant="danger">Out of stock</Badge>;
  if (stock <= 5) return <Badge variant="danger">{label}</Badge>;
  if (stock <= 10) return <Badge variant="warning">{label}</Badge>;
  return <Badge variant="success">{label}</Badge>;
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
  const { addToast } = useToast();
  const { can } = usePermissions();

  const canAdd = can('inventory', 'add');
  const canEdit = can('inventory', 'edit');
  const canDelete = can('inventory', 'delete');

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
      const matchesSearch = !term || i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term);
      const matchesCat = !categoryFilter || i.category === categoryFilter;
      const matchesStock = !stockFilter
        || (stockFilter === 'low' && i.stock > 0 && i.stock <= 10)
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
    },
  });

  const totalValue = useMemo(() => items.reduce((s, i) => s + i.price * i.stock, 0), [items]);
  const lowStockCount = useMemo(() => items.filter(i => i.stock > 0 && i.stock <= 10).length, [items]);
  const outOfStockCount = useMemo(() => items.filter(i => i.stock === 0).length, [items]);

  const openAdd = () => { setEditing(null); setForm(emptyItem); setAddingCategory(false); setNewCategory(''); setModalOpen(true); };
  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({ name: item.name, price: item.price, stock: item.stock, category: item.category, unit: item.unit });
    setAddingCategory(false);
    setNewCategory('');
    setModalOpen(true);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Manage items, prices and stock levels.</p>
        </div>
        {canAdd && <Button variant="primary" icon={<Plus size={16} />} onClick={openAdd}>Add item</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Items" value={String(items.length)} icon={<Package size={18} />} />
        <StatCard title="Stock Value" value={formatCurrency(totalValue)} icon={<TrendingUp size={18} />} />
        <StatCard
          title="Low Stock"
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
          <SearchInput placeholder="Search by name or category..." value={search} onSearch={setSearch} />
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
              ⚠ Low stock ({lowStockCount})
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

      {filtered.length === 0 ? (
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
                      <p className="text-xs text-gray-500">{i.category}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{i.name}</p>
                    </div>
                  ),
                },
                {
                  key: 'price',
                  header: 'Price',
                  sortable: true,
                  render: i => <span className="tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(i.price)}</span>,
                  className: 'text-right',
                },
                {
                  key: 'stock',
                  header: 'Stock',
                  sortable: true,
                  render: i => <StockPill stock={i.stock} unit={i.unit} />,
                },
                {
                  key: 'value',
                  header: 'Value',
                  render: i => <span className="tabular-nums text-gray-500">{formatCurrency(i.price * i.stock)}</span>,
                  className: 'text-right',
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right w-40',
                  render: i => (
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
                  <div>
                    <p className="text-xs text-gray-500">{i.category}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{i.name}</p>
                    <p className="text-xs text-gray-500 tabular-nums mt-0.5">Value: {formatCurrency(i.price * i.stock)}</p>
                  </div>
                  <div className="text-right">
                    <span className="tabular-nums text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(i.price)}</span>
                    <div className="mt-1"><StockPill stock={i.stock} unit={i.unit} /></div>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit item' : 'Add item'}>
        <div className="space-y-4">
          <Input label="Item name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engine Oil 5W-30" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹) *" type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            <Input label="Stock *" type="number" value={form.stock || ''} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
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

          <Input label="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g. piece, bottle, set" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? 'Save changes' : 'Add item'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
