import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { formatCurrency, generateId } from '../utils/formatters';
import type { InventoryItem } from '../types';

const categories = [
  { label: 'Oils', value: 'Oils' },
  { label: 'Brakes', value: 'Brakes' },
  { label: 'Filters', value: 'Filters' },
  { label: 'Ignition', value: 'Ignition' },
  { label: 'Clutch', value: 'Clutch' },
  { label: 'Belts', value: 'Belts' },
  { label: 'Electrical', value: 'Electrical' },
  { label: 'Fluids', value: 'Fluids' },
  { label: 'Accessories', value: 'Accessories' },
  { label: 'Cooling', value: 'Cooling' },
  { label: 'Suspension', value: 'Suspension' },
];

const emptyItem: Omit<InventoryItem, 'id'> = { name: '', price: 0, stock: 0, category: '', unit: 'piece' };

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyItem);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyItem);
    setModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({ name: item.name, price: item.price, stock: item.stock, category: item.category, unit: item.unit });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.category) return;
    if (editing) {
      setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...form } : i));
    } else {
      setItems(prev => [...prev, { id: generateId(), ...form }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (stock < 5) return <Badge variant="warning">Low</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput placeholder="Search items..." onSearch={setSearch} className="sm:w-80" />
        <Button icon={<Plus size={18} />} onClick={openAdd}>Add Item</Button>
      </div>

      <Table
        columns={[
          { key: 'name', header: 'Item Name', render: i => <span className="font-medium">{i.name}</span> },
          { key: 'category', header: 'Category', render: i => i.category },
          { key: 'price', header: 'Price', render: i => formatCurrency(i.price) },
          { key: 'stock', header: 'Stock', render: i => `${i.stock} ${i.unit}s` },
          { key: 'status', header: 'Status', render: i => getStockStatus(i.stock) },
          {
            key: 'actions', header: '', render: i => (
              <div className="flex gap-1">
                <button onClick={() => openEdit(i)} className="rounded p-1.5 hover:bg-[var(--hover-bg)] cursor-pointer">
                  <Pencil size={16} className="text-[var(--text-secondary)]" />
                </button>
                <button onClick={() => handleDelete(i.id)} className="rounded p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            ),
            className: 'w-20',
          },
        ]}
        data={filtered}
        keyExtractor={i => i.id}
        emptyMessage="No items found"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'Add Item'}>
        <div className="space-y-4">
          <Input label="Item Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engine Oil 5W-30" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹)" type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            <Input label="Stock" type="number" value={form.stock || ''} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Dropdown label="Category" options={categories} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Select category" />
            <Input label="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g. piece, bottle" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add Item'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
