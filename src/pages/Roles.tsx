import { useMemo, useState } from 'react';
import { Plus, Shield, Trash2, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { roles as initialRoles, staffMembers } from '../data/dummy';
import { generateId } from '../utils/formatters';
import type { Role, Permissions } from '../types';

const permissionLabels: Record<keyof Permissions, { label: string; helper: string }> = {
  inventory: { label: 'Inventory', helper: 'View & edit stock' },
  billing: { label: 'Billing', helper: 'Create & print bills' },
  udhaar: { label: 'Udhaar / Credit Sales', helper: 'Track pending dues' },
  reports: { label: 'Reports', helper: 'See sales reports' },
  staff: { label: 'Staff', helper: 'Manage team members' },
  settings: { label: 'Settings', helper: 'Change shop settings' },
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
  const [rolesList, setRolesList] = useState<Role[]>(initialRoles);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const memberCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of staffMembers) {
      map.set(s.role, (map.get(s.role) ?? 0) + 1);
    }
    return map;
  }, []);

  const togglePermission = (roleId: string, key: keyof Permissions) => {
    setRolesList(prev =>
      prev.map(r =>
        r.id === roleId
          ? { ...r, permissions: { ...r.permissions, [key]: !r.permissions[key] } }
          : r
      )
    );
  };

  const handleSave = (roleId: string) => {
    setSavedId(roleId);
    setTimeout(() => setSavedId(null), 1800);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    setRolesList(prev => [
      ...prev,
      { id: generateId(), name: newName.trim(), permissions: { ...defaultPermissions } },
    ]);
    setNewName('');
    setAddOpen(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setRolesList(prev => prev.filter(r => r.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Permissions per role</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Role Management</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Decide what each role is allowed to do.</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Add role
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rolesList.map(role => {
          const count = memberCount.get(role.name) ?? 0;
          return (
            <Card key={role.id}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-500/20 dark:to-cyan-500/20 border border-gray-200 dark:border-white/10 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0">
                  <Shield size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.3em] text-gray-500">
                    {count} {count === 1 ? 'member' : 'members'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.entries(permissionLabels) as [keyof Permissions, { label: string; helper: string }][]).map(
                  ([key, meta]) => (
                    <div
                      key={key}
                      className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-md p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">{meta.label}</p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-0.5 truncate">
                          {meta.helper}
                        </p>
                      </div>
                      <Toggle
                        checked={role.permissions[key]}
                        onChange={() => togglePermission(role.id, key)}
                      />
                    </div>
                  )
                )}
              </div>

              <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200 dark:border-white/5">
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={() => setConfirmDelete(role)}
                >
                  Delete role
                </Button>
                <div className="flex items-center gap-3">
                  {savedId === role.id && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">Saved</span>
                  )}
                  <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={() => handleSave(role.id)}>
                    Save changes
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add role">
        <div className="space-y-4">
          <Input
            label="Role name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Supervisor"
          />
          <p className="text-xs text-gray-500">
            You can set permissions for this role after it's created.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Create role
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete role?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This will permanently remove the role
            {confirmDelete ? <span className="text-gray-900 dark:text-white font-medium"> &quot;{confirmDelete.name}&quot;</span> : ''}.
            Staff with this role will lose its permissions.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
