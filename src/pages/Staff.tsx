import { useMemo, useState } from 'react';
import { UserPlus, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, StatCard } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { SearchInput } from '../components/ui/SearchInput';
import { Toggle } from '../components/ui/Toggle';
import { staffMembers as initialStaff, roles } from '../data/dummy';
import { generateId } from '../utils/formatters';
import type { StaffMember } from '../types';

const roleFilterOptions = [
  { label: 'All roles', value: '' },
  ...roles.map(r => ({ label: r.name, value: r.name })),
];

const roleFormOptions = roles.map(r => ({ label: r.name, value: r.name }));

function initialOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-10 h-10 text-base';
  return (
    <div
      className={`${cls} rounded-full bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-500/20 dark:to-cyan-500/20 border border-gray-200 dark:border-white/10 flex items-center justify-center text-purple-700 dark:text-purple-300 font-semibold shrink-0`}
    >
      {initialOf(name)}
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  const cls = active
    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
    : 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-300' : 'bg-red-300'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', role: '', active: true });

  const totalCount = staff.length;
  const activeCount = staff.filter(s => s.active).length;
  const inactiveCount = totalCount - activeCount;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter(s => {
      const matchesQ = !q || s.name.toLowerCase().includes(q) || s.phone.includes(q);
      const matchesRole = !roleFilter || s.role === roleFilter;
      return matchesQ && matchesRole;
    });
  }, [staff, search, roleFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', role: roles[0]?.name ?? '', active: true });
    setModalOpen(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone, role: s.role, active: s.active });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.role) return;
    if (editing) {
      setStaff(prev => prev.map(s => (s.id === editing.id ? { ...s, ...form } : s)));
    } else {
      setStaff(prev => [...prev, { id: generateId(), ...form }]);
    }
    setModalOpen(false);
  };

  const toggleActive = (s: StaffMember) => {
    setStaff(prev => prev.map(x => (x.id === s.id ? { ...x, active: !x.active } : x)));
  };

  const handleDelete = (s: StaffMember) => {
    setStaff(prev => prev.filter(x => x.id !== s.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Your team</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage who can use your shop app.</p>
        </div>
        <Button variant="primary" icon={<UserPlus size={16} />} onClick={openAdd}>
          Add staff
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Staff" value={String(totalCount)} icon={<Users size={18} />} delay={1} />
        <StatCard title="Active" value={String(activeCount)} icon={<Users size={18} />} delay={2} />
        <StatCard title="Inactive" value={String(inactiveCount)} icon={<Users size={18} />} delay={3} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by name or phone"
              value={search}
              onSearch={setSearch}
            />
          </div>
          <div className="sm:w-56">
            <Dropdown
              options={roleFilterOptions}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3 sm:hidden">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-gray-500 py-6">No staff found.</p>
          </Card>
        ) : (
          filtered.map(s => (
            <Card key={s.id} padding={false} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={s.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-gray-900 dark:text-white font-semibold truncate">{s.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">Role</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{s.role}</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-mono">{s.phone}</p>
                    </div>
                    <StatusPill active={s.active} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-white/5">
                    <Toggle checked={s.active} onChange={() => toggleActive(s)} label={s.active ? 'Active' : 'Off'} />
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(s)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(s)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="hidden sm:block">
        <Table
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: s => (
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} size="sm" />
                  <span className="text-gray-900 dark:text-white font-medium">{s.name}</span>
                </div>
              ),
            },
            { key: 'role', header: 'Role', render: s => <span className="text-gray-700 dark:text-gray-300">{s.role}</span> },
            { key: 'phone', header: 'Phone', render: s => <span className="text-gray-600 dark:text-gray-400 font-mono">{s.phone}</span> },
            { key: 'status', header: 'Status', render: s => <StatusPill active={s.active} /> },
            {
              key: 'actions',
              header: '',
              className: 'w-56',
              render: s => (
                <div className="flex items-center justify-end gap-2">
                  <Toggle checked={s.active} onChange={() => toggleActive(s)} />
                  <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(s)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(s)}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={filtered}
          keyExtractor={s => s.id}
          emptyMessage="No staff found."
        />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit staff' : 'Add staff'}>
        <div className="space-y-4">
          <Input
            label="Full name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Rahul Mehta"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="10-digit mobile number"
            inputMode="tel"
          />
          <Dropdown
            label="Role"
            options={roleFormOptions}
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            placeholder="Choose a role"
          />
          <div className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-3">
            <div>
              <p className="text-sm text-gray-900 dark:text-white">Active</p>
              <p className="text-xs text-gray-500">Inactive staff cannot sign in.</p>
            </div>
            <Toggle checked={form.active} onChange={v => setForm({ ...form, active: v })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editing ? 'Save changes' : 'Add staff'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
