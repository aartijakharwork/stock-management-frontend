import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, PackageX } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SearchInput } from '../components/ui/SearchInput';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { inventoryItems as initialItems } from '../data/dummy';
import { formatCurrency, generateId } from '../utils/formatters';
import type { InventoryItem } from '../types';

type SortKey = 'name' | 'price' | 'stock';

const emptyItem: Omit<InventoryItem, 'id'> = {
  name: '',
  price: 0,
  stock: 0,
  category: '',
  unit: 'piece',
};

function StockPill({ stock, unit }: { stock: number; unit: string }) {
  const label = `${stock} ${unit}${stock === 1 ? '' : 's'}`;
  if (stock <= 5) return <Badge variant="danger">{label}</Badge>;
  if (stock <= 10) return <Badge variant="warning">{label}</Badge>;
  return <Badge variant="success">{label}</Badge>;
}

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<Omit<InventoryItem, 'id'>>(emptyItem);

  const categoryOptions = useMemo(() => {
    const uniq = Array.from(new Set(items.map(i => i.category))).sort();
    return [
      { label: 'All categories', value: '' },
      ...uniq.map(c => ({ label: c, value: c })),
    ];
  }, [items]);

  const sortOptions: { label: string; value: SortKey }[] = [
    { label: 'Name (A–Z)', value: 'name' },
    { label: 'Price (high to low)', value: 'price' },
    { label: 'Stock (low to high)', value: 'stock' },
  ];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = items.filter(i => {
      const matchesSearch =
        !term ||
        i.name.toLowerCase().includes(term) ||
        i.category.toLowerCase().includes(term);
      const matchesCategory = !category || i.category === category;
      return matchesSearch && matchesCategory;
    });
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return b.price - a.price;
      return a.stock - b.stock;
    });
    return sorted;
  }, [items, search, category, sortBy]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyItem);
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
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.category.trim()) return;
    if (editing) {
      setItems(prev => prev.map(i => (i.id === editing.id ? { ...i, ...form } : i)));
    } else {
      setItems(prev => [...prev, { id: generateId(), ...form }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">
            Stock room
          </p>
          <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Inventory</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your items, prices and stock levels.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openAdd}>
          Add item
        </Button>
      </div>

      {/* Toolbar */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <p className="mb-1.5 text-[11px] uppercase tracking-[0.2em] text-gray-500 font-medium">
              Search
            </p>
            <SearchInput
              placeholder="Search by name or category…"
              value={search}
              onSearch={setSearch}
            />
          </div>
          <div className="sm:w-48">
            <Dropdown
              label="Category"
              options={categoryOptions}
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
          </div>
          <div className="sm:w-56">
            <Dropdown
              label="Sort by"
              options={sortOptions}
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
            />
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500">
            <PackageX size={36} />
            <p className="text-sm">No items match your search.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Table on sm and up */}
          <div className="hidden sm:block">
            <Table
              columns={[
                {
                  key: 'item',
                  header: 'Item',
                  render: i => (
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">
                        {i.category}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white truncate">{i.name}</p>
                    </div>
                  ),
                },
                {
                  key: 'price',
                  header: 'Price',
                  render: i => (
                    <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(i.price)}</span>
                  ),
                  className: 'text-right',
                },
                {
                  key: 'stock',
                  header: 'Stock',
                  render: i => <StockPill stock={i.stock} unit={i.unit} />,
                },
                {
                  key: 'unit',
                  header: 'Unit',
                  render: i => <span className="text-gray-600 dark:text-gray-400">{i.unit}</span>,
                },
                {
                  key: 'actions',
                  header: '',
                  render: i => (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil size={14} />}
                        onClick={() => openEdit(i)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleDelete(i.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ),
                  className: 'text-right w-48',
                },
              ]}
              data={filtered}
              keyExtractor={i => i.id}
            />
          </div>

          {/* Card list on mobile */}
          <ul className="space-y-3 sm:hidden">
            {filtered.map(i => (
              <li
                key={i.id}
                className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">
                      {i.category}
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{i.name}</p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Per {i.unit}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="tabular-nums text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(i.price)}
                    </span>
                    <StockPill stock={i.stock} unit={i.unit} />
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-gray-200 dark:border-white/5 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Pencil size={14} />}
                    onClick={() => openEdit(i)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={() => handleDelete(i.id)}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit item' : 'Add item'}
      >
        <div className="space-y-4">
          <Input
            label="Item name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Engine Oil 5W-30"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Price (₹)"
              type="number"
              value={form.price || ''}
              onChange={e => setForm({ ...form, price: Number(e.target.value) })}
              placeholder="0"
            />
            <Input
              label="Stock"
              type="number"
              value={form.stock || ''}
              onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Category"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Filters"
            />
            <Input
              label="Unit"
              value={form.unit}
              onChange={e => setForm({ ...form, unit: e.target.value })}
              placeholder="e.g. piece, bottle"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editing ? 'Save changes' : 'Add item'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
