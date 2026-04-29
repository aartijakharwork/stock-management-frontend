import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { staffMembers as initialStaff, roles } from '../data/dummy';
import { generateId } from '../utils/formatters';
import type { StaffMember } from '../types';

const roleOptions = roles.map(r => ({ label: r.name, value: r.name }));

export function Staff() {
  const [staff, setStaff] = useState(initialStaff);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', role: '', active: true });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', role: '', active: true });
    setModalOpen(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone, role: s.role, active: s.active });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.role) return;
    if (editing) {
      setStaff(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      setStaff(prev => [...prev, { id: generateId(), ...form }]);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button icon={<Plus size={18} />} onClick={openAdd}>Add Staff</Button>
      </div>

      <Table
        columns={[
          { key: 'name', header: 'Name', render: s => <span className="font-medium">{s.name}</span> },
          { key: 'phone', header: 'Phone', render: s => s.phone },
          { key: 'role', header: 'Role', render: s => <Badge variant="info">{s.role}</Badge> },
          {
            key: 'status', header: 'Status', render: s =>
              s.active ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>,
          },
          {
            key: 'actions', header: '', render: s => (
              <button onClick={() => openEdit(s)} className="rounded p-1.5 hover:bg-[var(--hover-bg)] cursor-pointer">
                <Pencil size={16} className="text-[var(--text-secondary)]" />
              </button>
            ),
            className: 'w-12',
          },
        ]}
        data={staff}
        keyExtractor={s => s.id}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Staff' : 'Add Staff'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
          <Dropdown label="Role" options={roleOptions} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Select role" />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-color)] text-primary-400 accent-primary-400 focus:ring-primary-400"
            />
            <label htmlFor="active" className="text-[13px] text-[var(--text-primary)]">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add Staff'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
