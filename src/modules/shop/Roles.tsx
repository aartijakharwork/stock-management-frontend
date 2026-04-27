import { useState, useMemo } from 'react';
import { Plus, Shield, Trash2, Save, Check, X as XIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { roles as initialRoles, staffMembers } from '../../data/shop-dummy';
import { generateId } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import type { Role, RolePermissions, AppModule, ModuleAction, DEFAULT_MODULE_PERMISSIONS } from '../../types';

const MODULE_META: { key: AppModule; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'billing', label: 'Billing' },
  { key: 'customers', label: 'Customers' },
  { key: 'bills', label: 'Bills History' },
  { key: 'staff', label: 'Staff' },
  { key: 'roles', label: 'Roles' },
  { key: 'settings', label: 'Settings' },
  { key: 'subscription', label: 'Subscription' },
];

const ACTION_LABELS: { key: ModuleAction; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'add', label: 'Add' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
];

const emptyPermissions: RolePermissions = Object.fromEntries(
  MODULE_META.map(m => [m.key, { view: false, add: false, edit: false, delete: false }])
) as RolePermissions;

function PermissionToggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${
        checked
          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {checked ? <Check size={14} /> : <XIcon size={14} />}
    </button>
  );
}

export function ShopRoles() {
  const [rolesList, setRolesList] = useState<Role[]>(initialRoles);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
  const [newName, setNewName] = useState('');
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const { addToast } = useToast();
  const { can } = usePermissions();

  const canEdit = can('roles', 'edit');
  const canAdd = can('roles', 'add');
  const canDelete = can('roles', 'delete');

  const memberCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of staffMembers) map.set(s.roleId, (map.get(s.roleId) ?? 0) + 1);
    return map;
  }, []);

  const togglePermission = (roleId: string, module: AppModule, action: ModuleAction) => {
    if (!canEdit) return;
    setRolesList(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      const modPerms = { ...r.permissions[module] };
      modPerms[action] = !modPerms[action];
      if (!modPerms.view && (modPerms.add || modPerms.edit || modPerms.delete)) {
        modPerms.view = true;
      }
      return { ...r, permissions: { ...r.permissions, [module]: modPerms } };
    }));
  };

  const toggleModuleAll = (roleId: string, module: AppModule) => {
    if (!canEdit) return;
    setRolesList(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      const allEnabled = ACTION_LABELS.every(a => r.permissions[module][a.key]);
      const newPerms = allEnabled
        ? { view: false, add: false, edit: false, delete: false }
        : { view: true, add: true, edit: true, delete: true };
      return { ...r, permissions: { ...r.permissions, [module]: newPerms } };
    }));
  };

  const handleSave = (roleId: string) => {
    const role = rolesList.find(r => r.id === roleId);
    addToast('success', 'Role saved', `Permissions for ${role?.name} updated.`);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newRole: Role = { id: generateId(), name: newName.trim(), permissions: { ...emptyPermissions } };
    setRolesList(prev => [...prev, newRole]);
    setNewName('');
    setAddOpen(false);
    addToast('success', 'Role created');
    setExpandedRole(newRole.id);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setRolesList(prev => prev.filter(r => r.id !== confirmDelete.id));
    addToast('success', 'Role deleted');
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">Define what each role can access and do.</p>
        </div>
        {canAdd && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>Add role</Button>
        )}
      </div>

      <div className="space-y-4">
        {rolesList.map(role => {
          const count = memberCount.get(role.id) ?? 0;
          const isExpanded = expandedRole === role.id;

          return (
            <Card key={role.id}>
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedRole(isExpanded ? null : role.id)}
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Shield size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                    <Badge variant="neutral">{count} {count === 1 ? 'member' : 'members'}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {MODULE_META.filter(m => role.permissions[m.key].view).map(m => m.label).join(', ') || 'No permissions'}
                  </p>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isExpanded && (
                <div className="mt-5">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                            {ACTION_LABELS.map(a => (
                              <th key={a.key} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                {a.label}
                              </th>
                            ))}
                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">All</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                          {MODULE_META.map(mod => {
                            const allEnabled = ACTION_LABELS.every(a => role.permissions[mod.key][a.key]);
                            return (
                              <tr key={mod.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-4 py-2.5">
                                  <span className="font-medium text-gray-900 dark:text-white">{mod.label}</span>
                                </td>
                                {ACTION_LABELS.map(a => (
                                  <td key={a.key} className="px-3 py-2.5 text-center">
                                    <div className="flex justify-center">
                                      <PermissionToggle
                                        checked={role.permissions[mod.key][a.key]}
                                        onChange={() => togglePermission(role.id, mod.key, a.key)}
                                        disabled={!canEdit}
                                      />
                                    </div>
                                  </td>
                                ))}
                                <td className="px-3 py-2.5 text-center">
                                  <div className="flex justify-center">
                                    <PermissionToggle
                                      checked={allEnabled}
                                      onChange={() => toggleModuleAll(role.id, mod.key)}
                                      disabled={!canEdit}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                    {canDelete && (
                      <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setConfirmDelete(role)}>Delete role</Button>
                    )}
                    {canEdit && (
                      <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={() => handleSave(role.id)}>Save changes</Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add role">
        <div className="space-y-4">
          <Input label="Role name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Supervisor" />
          <p className="text-xs text-gray-500">You can set permissions after creating.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd}>Create role</Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete role?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will permanently remove {confirmDelete && <span className="font-medium text-gray-900 dark:text-white">"{confirmDelete.name}"</span>}. Staff with this role will lose its permissions.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
