import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, PackageX } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { inventoryItems as initialItems } from '../../data/shop-dummy';
import { formatCurrency, generateId } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { usePagination } from '../../hooks/usePagination';
import type { InventoryItem } from '../../types';

const emptyItem: Omit<InventoryItem, 'id'> = { name: '', price: 0, stock: 0, category: '', unit: 'piece' };

function StockPill({ stock, unit }: { stock: number; unit: string }) {
  const label = `${stock} ${unit}${stock === 1 ? '' : 's'}`;
  if (stock <= 5) return <Badge variant="danger">{label}</Badge>;
  if (stock <= 10) return <Badge variant="warning">{label}</Badge>;
  return <Badge variant="success">{label}</Badge>;
}

export function ShopInventory() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<Omit<InventoryItem, 'id'>>(emptyItem);
  const { addToast } = useToast();
  const { can } = usePermissions();

  const canAdd = can('inventory', 'add');
  const canEdit = can('inventory', 'edit');
  const canDelete = can('inventory', 'delete');

  const categoryOptions = useMemo(() => {
    const uniq = Array.from(new Set(items.map(i => i.category))).sort();
    return [{ label: 'All categories', value: '' }, ...uniq.map(c => ({ label: c, value: c }))];
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(i => {
      const matchesSearch = !term || i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term);
      const matchesCategory = !category || i.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, category]);

  const pagination = usePagination({
    data: filtered,
    pageSize: 8,
    sortFns: {
      item: (a, b) => a.name.localeCompare(b.name),
      price: (a, b) => a.price - b.price,
      stock: (a, b) => a.stock - b.stock,
    },
  });

  const openAdd = () => { setEditing(null); setForm(emptyItem); setModalOpen(true); };
  const openEdit = (item: InventoryItem) => { setEditing(item); setForm({ name: item.name, price: item.price, stock: item.stock, category: item.category, unit: item.unit }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.category.trim()) return;
    if (editing) {
      setItems(prev => prev.map(i => (i.id === editing.id ? { ...i, ...form } : i)));
      addToast('success', 'Item updated');
    } else {
      setItems(prev => [...prev, { id: generateId(), ...form }]);
      addToast('success', 'Item added');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
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

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1"><SearchInput placeholder="Search by name or category..." value={search} onSearch={setSearch} /></div>
          <div className="sm:w-48"><Dropdown options={categoryOptions} value={category} onChange={e => setCategory(e.target.value)} /></div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card><div className="flex flex-col items-center gap-3 py-12 text-gray-400"><PackageX size={36} /><p className="text-sm">No items match your search.</p></div></Card>
      ) : (
        <>
          <div className="hidden sm:block">
            <Table
              columns={[
                { key: 'item', header: 'Item', sortable: true, render: i => (<div><p className="text-xs text-gray-500">{i.category}</p><p className="text-sm font-medium text-gray-900 dark:text-white">{i.name}</p></div>) },
                { key: 'price', header: 'Price', sortable: true, render: i => <span className="tabular-nums text-gray-900 dark:text-white">{formatCurrency(i.price)}</span>, className: 'text-right' },
                { key: 'stock', header: 'Stock', sortable: true, render: i => <StockPill stock={i.stock} unit={i.unit} /> },
                { key: 'unit', header: 'Unit', render: i => <span className="text-gray-500">{i.unit}</span> },
                { key: 'actions', header: '', className: 'text-right w-48', render: i => (
                  <div className="flex justify-end gap-1">
                    {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(i)}>Edit</Button>}
                    {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(i.id)}>Delete</Button>}
                  </div>
                )},
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
          <ul className="space-y-3 sm:hidden">
            {pagination.pageData.map(i => (
              <li key={i.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs text-gray-500">{i.category}</p><p className="text-sm font-medium text-gray-900 dark:text-white">{i.name}</p></div>
                  <div className="text-right"><span className="tabular-nums text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(i.price)}</span><div className="mt-1"><StockPill stock={i.stock} unit={i.unit} /></div></div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-gray-200 dark:border-gray-800 pt-3">
                  {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(i)} className="flex-1">Edit</Button>}
                  {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(i.id)} className="flex-1">Delete</Button>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit item' : 'Add item'}>
        <div className="space-y-4">
          <Input label="Item name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engine Oil 5W-30" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Price (₹)" type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            <Input label="Stock" type="number" value={form.stock || ''} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Filters" />
            <Input label="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g. piece" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? 'Save changes' : 'Add item'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
