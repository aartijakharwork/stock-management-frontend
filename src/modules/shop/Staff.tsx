import { useMemo, useState, useEffect, useCallback } from 'react';
import { UserPlus, Pencil, Trash2, Users, Link2, Copy, Mail, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { SearchInput } from '../../components/ui/SearchInput';
import { Toggle } from '../../components/ui/Toggle';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { usePagination } from '../../hooks/usePagination';
import { api } from '../../api/client';
import type { StaffMember, StaffInvite, Role } from '../../types';

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm shrink-0">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export function ShopStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', roleId: '', active: true });
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '', roleId: '' });
  const [tab, setTab] = useState<'members' | 'invites'>('members');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const { can } = usePermissions();

  const canAdd = can('staff', 'add');
  const canEdit = can('staff', 'edit');
  const canDelete = can('staff', 'delete');

  const loadData = useCallback(async () => {
    const [staffRes, invitesRes, rolesRes] = await Promise.all([
      api('/shop/staff'),
      api('/shop/staff/invites'),
      api('/shop/roles'),
    ]);
    if (staffRes.ok) setStaff(await staffRes.json());
    if (invitesRes.ok) setInvites(await invitesRes.json());
    if (rolesRes.ok) setRoles(await rolesRes.json());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const roleFilterOptions = useMemo(() => [
    { label: 'All roles', value: '' },
    ...roles.map(r => ({ label: r.name, value: r.id })),
  ], [roles]);
  const roleFormOptions = useMemo(() => roles.map(r => ({ label: r.name, value: r.id })), [roles]);

  const activeCount = staff.filter(s => s.active).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter(s => {
      const matchesQ = !q || s.name.toLowerCase().includes(q) || s.phone.includes(q);
      const matchesRole = !roleFilter || s.roleId === roleFilter;
      return matchesQ && matchesRole;
    });
  }, [staff, search, roleFilter]);

  const pagination = usePagination({
    data: filtered,
    pageSize: 5,
    sortFns: {
      name: (a, b) => a.name.localeCompare(b.name),
    },
  });

  const openAdd = () => { setEditing(null); setForm({ name: '', email: '', phone: '', roleId: roles[0]?.id ?? '', active: true }); setModalOpen(true); };
  const openEdit = (s: StaffMember) => { setEditing(s); setForm({ name: s.name, email: s.email || '', phone: s.phone, roleId: s.roleId, active: s.active }); setModalOpen(true); };

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name ?? 'Unknown';

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.roleId) return;
    setSaving(true);
    try {
      if (editing) {
        setStaff(prev => prev.map(s => (s.id === editing.id ? { ...s, name: form.name, email: form.email, phone: form.phone, roleId: form.roleId, role: getRoleName(form.roleId), active: form.active } : s)));
        addToast('success', 'Staff updated');
      } else {
        const res = await api('/shop/staff', {
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            name: form.name,
            phone: form.phone,
            password: 'Temp@123',
            roleId: form.roleId || undefined,
          }),
        });
        if (res.ok) {
          const newStaff = await res.json();
          setStaff(prev => [...prev, newStaff]);
          addToast('success', 'Staff added');
        } else {
          const err = await res.json();
          addToast('error', 'Error', err.error || 'Could not add staff');
        }
      }
    } finally {
      setSaving(false);
    }
    setModalOpen(false);
  };

  const toggleActive = (s: StaffMember) => {
    setStaff(prev => prev.map(x => (x.id === s.id ? { ...x, active: !x.active } : x)));
    addToast('info', `${s.name} ${s.active ? 'deactivated' : 'activated'}`);
  };

  const handleDelete = async (s: StaffMember) => {
    const res = await api(`/shop/staff/${s.id}`, { method: 'DELETE' });
    if (res.ok) {
      setStaff(prev => prev.filter(x => x.id !== s.id));
      addToast('success', 'Staff removed');
    } else {
      addToast('error', 'Error', 'Could not remove staff member');
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.roleId) return;
    setSaving(true);
    try {
      const res = await api('/shop/staff/invites', {
        method: 'POST',
        body: JSON.stringify({
          name: inviteForm.name.trim(),
          email: inviteForm.email.trim(),
          phone: inviteForm.phone.trim(),
          roleId: inviteForm.roleId || undefined,
        }),
      });
      if (res.ok) {
        const newInvite = await res.json();
        setInvites(prev => [newInvite, ...prev]);
        setInviteOpen(false);
        addToast('success', 'Invite sent', `Invite email sent to ${inviteForm.email}`);
        setTab('invites');
      } else {
        const err = await res.json();
        addToast('error', 'Error', err.error || 'Could not send invite');
      }
    } finally {
      setSaving(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/auth/join/${token}`;
    navigator.clipboard.writeText(link);
    addToast('success', 'Link copied', 'Invite link copied to clipboard');
  };

  const inviteStatusVariant = (s: StaffInvite['status']): 'warning' | 'success' | 'danger' => {
    if (s === 'accepted') return 'success';
    if (s === 'expired') return 'danger';
    return 'warning';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
          <p className="mt-1 text-sm text-gray-500">Manage who can access your shop.</p>
        </div>
        {canAdd && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Link2 size={16} />} onClick={() => { setInviteForm({ name: '', email: '', phone: '', roleId: roles[0]?.id ?? '' }); setInviteOpen(true); }}>Invite staff</Button>
            <Button variant="primary" icon={<UserPlus size={16} />} onClick={openAdd}>Add staff</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Staff" value={String(staff.length)} icon={<Users size={18} />} />
        <StatCard title="Active" value={String(activeCount)} icon={<Users size={18} />} />
        <StatCard title="Pending Invites" value={String(invites.filter(i => i.status === 'pending').length)} icon={<Mail size={18} />} />
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setTab('members')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'members' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Members ({staff.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('invites')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'invites' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Invites ({invites.length})
        </button>
      </div>

      {tab === 'members' && (
        <>
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1"><SearchInput placeholder="Search by name or phone" value={search} onSearch={setSearch} /></div>
              <div className="sm:w-56"><Dropdown options={roleFilterOptions} value={roleFilter} onChange={e => setRoleFilter(e.target.value)} /></div>
            </div>
          </Card>

          <div className="hidden sm:block">
            <Table
              columns={[
                { key: 'name', header: 'Name', sortable: true, render: s => <div className="flex items-center gap-3"><Avatar name={s.name} /><div><span className="font-medium text-gray-900 dark:text-white">{s.name}</span>{s.email && <p className="text-xs text-gray-500">{s.email}</p>}</div></div> },
                { key: 'role', header: 'Role', render: s => <span className="text-gray-600 dark:text-gray-400">{s.role}</span> },
                { key: 'phone', header: 'Phone', render: s => <span className="text-gray-500 font-mono text-xs">{s.phone}</span> },
                { key: 'status', header: 'Status', render: s => s.active ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge> },
                { key: 'actions', header: '', className: 'w-56', render: s => (
                  <div className="flex items-center justify-end gap-2">
                    {canEdit && <Toggle checked={s.active} onChange={() => toggleActive(s)} />}
                    {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(s)}>Edit</Button>}
                    {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(s)}>Delete</Button>}
                  </div>
                )},
              ]}
              data={pagination.pageData}
              keyExtractor={s => s.id}
              emptyState={
                staff.length === 0 ? (
                  <EmptyState
                    icon={<Users size={28} />}
                    title="No staff added yet"
                    description="Add a team member directly, or invite them via a join link."
                    action={canAdd ? <Button variant="primary" icon={<UserPlus size={14} />} onClick={openAdd}>Add staff</Button> : undefined}
                    secondaryAction={canAdd ? <Button variant="secondary" icon={<Link2 size={14} />} size="sm" onClick={() => { setInviteForm({ name: '', email: '', phone: '', roleId: roles[0]?.id ?? '' }); setInviteOpen(true); }}>Invite via link</Button> : undefined}
                  />
                ) : (
                  <EmptyState
                    icon={<Users size={28} />}
                    title="No staff match your filters"
                    description="Try a different name or role filter."
                    compact
                  />
                )
              }
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

          <div className="space-y-3 sm:hidden">
            {pagination.pageData.map(s => (
              <Card key={s.id} padding={false} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={s.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-sm text-gray-500">{s.role}</p>
                        <p className="text-xs text-gray-500 font-mono">{s.phone}</p>
                      </div>
                      {s.active ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                      {canEdit && <Toggle checked={s.active} onChange={() => toggleActive(s)} label={s.active ? 'Active' : 'Off'} />}
                      <div className="flex gap-1">
                        {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(s)}>Edit</Button>}
                        {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(s)}>Delete</Button>}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'invites' && (
        <div className="space-y-3">
          {invites.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Mail size={28} />}
                title="No invites sent yet"
                description="Invite staff via a secure link they can use to join your shop."
                action={canAdd ? <Button variant="primary" icon={<Link2 size={14} />} onClick={() => { setInviteForm({ name: '', email: '', phone: '', roleId: roles[0]?.id ?? '' }); setInviteOpen(true); }}>Send first invite</Button> : undefined}
              />
            </Card>
          ) : (
            invites.map(inv => (
              <Card key={inv.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar name={inv.staffName} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{inv.staffName}</p>
                      <p className="text-xs text-gray-500">{inv.staffEmail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="neutral">{inv.roleName}</Badge>
                        <Badge variant={inviteStatusVariant(inv.status)}>{inv.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> Expires {inv.expiresAt}</span>
                    {inv.status === 'pending' && (
                      <Button variant="secondary" size="sm" icon={<Copy size={14} />} onClick={() => copyInviteLink(inv.token)}>Copy link</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit staff' : 'Add staff'}>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Input label="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rahul Mehta" />
          <Input label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. rahul@shop.in" />
          <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile number" inputMode="tel" />
          <Dropdown label="Role" options={roleFormOptions} value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} />
          <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
            <div><p className="text-sm text-gray-900 dark:text-white">Active</p><p className="text-xs text-gray-500">Inactive staff cannot sign in.</p></div>
            <Toggle checked={form.active} onChange={v => setForm({ ...form, active: v })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{editing ? 'Save changes' : 'Add staff'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite staff member">
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            handleInvite();
          }}
        >
          <p className="text-sm text-gray-500">Send an invite link. They can join using this link to create their staff account.</p>
          <Input label="Name" value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="e.g. Arjun Verma" />
          <Input label="Email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="e.g. arjun@email.com" />
          <Input label="Phone (optional)" value={inviteForm.phone} onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })} placeholder="10-digit mobile" inputMode="tel" />
          <Dropdown label="Assign role" options={roleFormOptions} value={inviteForm.roleId} onChange={e => setInviteForm({ ...inviteForm, roleId: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" icon={<Link2 size={14} />} disabled={saving}>Generate invite link</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
