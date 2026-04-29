import { useState } from 'react';
import { Plus, Pencil, Phone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { customers as initialCustomers } from '../data/dummy';
import { formatCurrency, generateId } from '../utils/formatters';
import type { Customer } from '../types';

export function Customers() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', pendingAmount: 0 });

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalPending = customers.reduce((sum, c) => sum + c.pendingAmount, 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', pendingAmount: 0 });
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, pendingAmount: c.pendingAmount });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    if (editing) {
      setCustomers(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } : c));
    } else {
      setCustomers(prev => [...prev, { id: generateId(), ...form }]);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Total pending: <span className="font-semibold text-red-500">{formatCurrency(totalPending)}</span>
          </p>
        </div>
        <Button icon={<Plus size={18} />} onClick={openAdd}>Add Customer</Button>
      </div>

      <SearchInput placeholder="Search by name or phone..." onSearch={setSearch} className="max-w-sm" />

      <Table
        columns={[
          { key: 'name', header: 'Name', render: c => <span className="font-medium">{c.name}</span> },
          {
            key: 'phone', header: 'Phone', render: c => (
              <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                <Phone size={14} /> {c.phone}
              </span>
            ),
          },
          {
            key: 'pending', header: 'Pending Amount', render: c => (
              c.pendingAmount > 0
                ? <span className="font-semibold text-red-500">{formatCurrency(c.pendingAmount)}</span>
                : <Badge variant="success">Clear</Badge>
            ),
          },
          {
            key: 'actions', header: '', render: c => (
              <button onClick={() => openEdit(c)} className="rounded p-1.5 hover:bg-[var(--hover-bg)] cursor-pointer">
                <Pencil size={16} className="text-[var(--text-secondary)]" />
              </button>
            ),
            className: 'w-12',
          },
        ]}
        data={filtered}
        keyExtractor={c => c.id}
        emptyMessage="No customers found"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Customer name" />
          <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
          <Input label="Pending Amount (₹)" type="number" value={form.pendingAmount || ''} onChange={e => setForm({ ...form, pendingAmount: Number(e.target.value) })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add Customer'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
