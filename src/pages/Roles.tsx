import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { Badge } from '../components/ui/Badge';
import { roles as initialRoles } from '../data/dummy';
import { generateId } from '../utils/formatters';
import type { Role, Permissions } from '../types';

const permissionLabels: Record<keyof Permissions, string> = {
  inventory: 'Inventory',
  billing: 'Billing',
  udhaar: 'Udhaar / Credit',
  reports: 'Reports',
  staff: 'Staff Management',
  settings: 'Settings',
};

const defaultPermissions: Permissions = {
  inventory: false,
  billing: false,
  udhaar: false,
  reports: false,
  staff: false,
  settings: false,
};

export function Roles() {
  const [rolesList, setRolesList] = useState(initialRoles);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formPerms, setFormPerms] = useState<Permissions>(defaultPermissions);

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormPerms(defaultPermissions);
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setFormName(role.name);
    setFormPerms({ ...defaultPermissions, ...(role.permissions as unknown as Permissions) });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (editing) {
      setRolesList(prev =>
        prev.map(r => r.id === editing.id ? { ...r, name: formName, permissions: formPerms as unknown as Role['permissions'] } : r)
      );
    } else {
      setRolesList(prev => [...prev, { id: generateId(), name: formName, permissions: formPerms as unknown as Role['permissions'] }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setRolesList(prev => prev.filter(r => r.id !== id));
  };

  const activeCount = (perms: Permissions) =>
    Object.values(perms).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button icon={<Plus size={18} />} onClick={openAdd}>Create Role</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rolesList.map(role => (
          <Card key={role.id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{role.name}</h3>
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  {activeCount(role.permissions as unknown as Permissions)} of {Object.keys(role.permissions).length} permissions
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(role)} className="rounded p-1.5 hover:bg-[var(--hover-bg)] cursor-pointer">
                  <Pencil size={16} className="text-[var(--text-secondary)]" />
                </button>
                <button onClick={() => handleDelete(role.id)} className="rounded p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(Object.entries(role.permissions as unknown as Permissions) as [keyof Permissions, boolean][]).map(
                ([key, value]) =>
                  value && permissionLabels[key] && (
                    <Badge key={key} variant="success">
                      {permissionLabels[key]}
                    </Badge>
                  )
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Role' : 'Create Role'}>
        <div className="space-y-4">
          <Input label="Role Name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Supervisor" />
          <div>
            <p className="mb-3 text-[13px] font-medium text-[var(--text-secondary)]">Permissions</p>
            <div className="space-y-3">
              {(Object.entries(permissionLabels) as [keyof Permissions, string][]).map(([key, label]) => (
                <Toggle
                  key={key}
                  label={label}
                  checked={formPerms[key]}
                  onChange={checked => setFormPerms(prev => ({ ...prev, [key]: checked }))}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Create Role'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
