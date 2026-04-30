import { useEffect, useState, useMemo } from 'react';
import {
  Plus, Phone, Eye, CircleDollarSign, Users, AlertCircle,
  ShieldCheck, Share2, Pencil,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { Card, StatCard } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExportMenu } from '../../components/ui/ExportMenu';
import { CardListSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { customers as initialCustomers, bills as initialBills } from '../../data/shop-dummy';
import { formatCurrency, formatDate, formatRelativeTime, generateId } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { usePagination } from '../../hooks/usePagination';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import type { Bill, Customer } from '../../types';
import type { ExportColumn } from '../../utils/exporters';

type DuesFilter = '' | 'with' | 'cleared';

function getSecuritySettings() {
  const enabled = localStorage.getItem('shopmanager.security.enabled') === 'true';
  const code = localStorage.getItem('shopmanager.security.code') || '';
  return { enabled: enabled && code.length > 0, code };
}

const emptyForm = { name: '', phone: '', address: '' };

function lastPaymentMap(bills: Bill[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const b of bills) {
    if (!b.customerId || !b.paid) continue;
    const prev = map.get(b.customerId);
    if (!prev || new Date(b.date) > new Date(prev)) map.set(b.customerId, b.date);
  }
  return map;
}

const customerStatus = (c: Customer) => c.pendingAmount > 0 ? 'Pending' : 'Cleared';

export function ShopCustomers() {
  const [customersList, setCustomers] = useState(initialCustomers);
  const [bills, setBills] = useState(initialBills);
  const [search, setSearch] = useState('');
  const [duesFilter, setDuesFilter] = useState<DuesFilter>('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<{ name?: string; phone?: string }>({});
  const [selected, setSelected] = useState<Customer | null>(null);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState<Customer | null>(null);
  const [securityInput, setSecurityInput] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { can } = usePermissions();
  const { track } = useRecentlyViewed();

  const openDetail = (c: Customer) => {
    setSelected(c);
    track({
      kind: 'customer',
      id: c.id,
      label: c.name,
      sublabel: c.pendingAmount > 0
        ? `Udhaar ${formatCurrency(c.pendingAmount)}`
        : 'All cleared',
      to: '/shop/customers',
    });
  };

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const canAdd = can('customers', 'add');
  const canEdit = can('customers', 'edit');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customersList.filter(c => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
      const matchesDues = !duesFilter
        || (duesFilter === 'with' && c.pendingAmount > 0)
        || (duesFilter === 'cleared' && c.pendingAmount === 0);
      return matchesSearch && matchesDues;
    });
  }, [customersList, search, duesFilter]);

  const pagination = usePagination({
    data: filtered,
    pageSize: 8,
    sortFns: {
      name: (a, b) => a.name.localeCompare(b.name),
      pending: (a, b) => a.pendingAmount - b.pendingAmount,
    },
  });

  const totalPending = customersList.reduce((s, c) => s + c.pendingAmount, 0);
  const dueCount = customersList.filter(c => c.pendingAmount > 0).length;
  const clearedCount = customersList.filter(c => c.pendingAmount === 0).length;

  const lastPayments = useMemo(() => lastPaymentMap(bills), [bills]);

  const exportColumns = useMemo<ExportColumn<Customer>[]>(() => [
    { header: 'Name', accessor: c => c.name },
    { header: 'Phone', accessor: c => c.phone },
    { header: 'Address', accessor: c => c.address || '' },
    { header: 'Pending (₹)', accessor: c => c.pendingAmount },
    { header: 'Status', accessor: c => customerStatus(c) },
    {
      header: 'Last paid',
      accessor: c => {
        const d = lastPayments.get(c.id);
        return d ? formatDate(d) : '—';
      },
    },
  ], [lastPayments]);

  const openAdd = () => { setForm(emptyForm); setFormError({}); setAddOpen(true); };
  const openEdit = (c: Customer) => {
    setEditTarget(c);
    setForm({ name: c.name, phone: c.phone, address: c.address || '' });
    setFormError({});
    setEditOpen(true);
  };

  const validateForm = () => {
    const errs: typeof formError = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    setFormError(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    setCustomers(prev => [...prev, {
      id: generateId(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim() || undefined,
      pendingAmount: 0,
    }]);
    setAddOpen(false);
    addToast('success', 'Customer added');
  };

  const handleEditSave = () => {
    if (!validateForm() || !editTarget) return;
    setCustomers(prev => prev.map(c =>
      c.id === editTarget.id
        ? { ...c, name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() || undefined }
        : c
    ));
    if (selected?.id === editTarget.id) setSelected(prev => prev ? { ...prev, name: form.name.trim(), phone: form.phone.trim() } : null);
    setEditOpen(false);
    addToast('success', 'Customer updated');
  };

  const doSettle = (customer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, pendingAmount: 0 } : c));
    setBills(prev => prev.map(b => b.customerId === customer.id && b.isUdhaar && !b.paid ? { ...b, paid: true } : b));
    if (selected?.id === customer.id) setSelected({ ...customer, pendingAmount: 0 });
    addToast('success', 'Dues settled', `${formatCurrency(customer.pendingAmount)} received from ${customer.name}`);
  };

  const requestSettle = (customer: Customer) => {
    if (customer.pendingAmount === 0) return;
    const security = getSecuritySettings();
    if (security.enabled) {
      setSettleTarget(customer);
      setSecurityInput('');
      setSecurityError('');
      setSecurityOpen(true);
    } else {
      doSettle(customer);
    }
  };

  const confirmSettle = () => {
    const security = getSecuritySettings();
    if (securityInput !== security.code) { setSecurityError('Invalid security code'); return; }
    if (!settleTarget) return;
    doSettle(settleTarget);
    setSecurityOpen(false);
    setSettleTarget(null);
  };

  const sendWhatsAppReminder = (c: Customer) => {
    const text = encodeURIComponent(
      `Hi ${c.name}, this is a gentle reminder that you have a pending payment of ${formatCurrency(c.pendingAmount)} at our shop. Kindly clear at your earliest convenience. Thank you!`
    );
    window.open(`https://wa.me/91${c.phone}?text=${text}`, '_blank');
  };

  const customerBills = useMemo(() =>
    selected ? bills.filter(b => b.customerId === selected.id) : [],
    [selected, bills]
  );

  const customerTotalSpent = useMemo(() =>
    selected ? bills.filter(b => b.customerId === selected.id).reduce((s, b) => s + b.total, 0) : 0,
    [selected, bills]
  );

  const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customers and track pending dues.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu<Customer>
            baseName="customers"
            title="Customers export"
            meta={`${filtered.length} of ${customersList.length} customers`}
            columns={exportColumns}
            rows={filtered}
            size="md"
          />
          {canAdd && <Button variant="primary" icon={<Plus size={16} />} onClick={openAdd}>Add customer</Button>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Customers" value={customersList.length.toString()} icon={<Users size={18} />} />
        <StatCard
          title="Pending Udhaar"
          value={formatCurrency(totalPending)}
          icon={<CircleDollarSign size={18} />}
          trend={`${dueCount} customer${dueCount === 1 ? '' : 's'}`}
          trendUp={false}
          onClick={() => setDuesFilter('with')}
        />
        <StatCard
          title="Cleared"
          value={clearedCount.toString()}
          icon={<AlertCircle size={18} />}
          trend={`${Math.round((clearedCount / customersList.length) * 100)}% cleared`}
          trendUp={true}
        />
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <SearchInput placeholder="Search by name or phone..." value={search} onSearch={setSearch} />
          <Dropdown
            options={[
              { label: 'All customers', value: '' },
              { label: `With dues (${dueCount})`, value: 'with' },
              { label: `Cleared (${clearedCount})`, value: 'cleared' },
            ]}
            value={duesFilter}
            onChange={e => setDuesFilter(e.target.value as DuesFilter)}
          />
        </div>
      </Card>

      {/* Desktop table */}
      <div className="hidden sm:block">
        {loading ? <TableSkeleton rows={6} columns={4} showAvatar /> : <Table
          columns={[
            {
              key: 'name',
              header: 'Customer',
              sortable: true,
              render: c => (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm shrink-0">
                    {initial(c.name)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                    {c.address && <p className="text-xs text-gray-400 truncate max-w-[180px]">{c.address}</p>}
                  </div>
                </div>
              ),
            },
            {
              key: 'phone',
              header: 'Phone',
              render: c => (
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <Phone size={13} /> {c.phone}
                </span>
              ),
            },
            {
              key: 'pending',
              header: 'Pending',
              sortable: true,
              render: c => {
                const lastPaid = lastPayments.get(c.id);
                return (
                  <div>
                    {c.pendingAmount > 0
                      ? <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{formatCurrency(c.pendingAmount)}</span>
                      : <Badge variant="success">Cleared</Badge>}
                    {lastPaid && (
                      <p className="text-[11px] text-gray-400 mt-0.5" title={formatDate(lastPaid)}>
                        Last paid {formatRelativeTime(lastPaid)}
                      </p>
                    )}
                  </div>
                );
              },
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: c => (
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" icon={<Eye size={13} />} onClick={e => { e.stopPropagation(); openDetail(c); }}>View</Button>
                  {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={e => { e.stopPropagation(); openEdit(c); }}>Edit</Button>}
                  {c.pendingAmount > 0 && (
                    <Button variant="ghost" size="sm" icon={<Share2 size={13} />} onClick={e => { e.stopPropagation(); sendWhatsAppReminder(c); }}>WA</Button>
                  )}
                  {canEdit && c.pendingAmount > 0 && (
                    <Button variant="primary" size="sm" onClick={e => { e.stopPropagation(); requestSettle(c); }}>Settle</Button>
                  )}
                </div>
              ),
            },
          ]}
          data={pagination.pageData}
          keyExtractor={c => c.id}
          emptyState={
            customersList.length === 0 ? (
              <EmptyState
                icon={<Users size={28} />}
                title="No customers added yet"
                description="Add a customer to track udhaar (credit), bill history, and send WhatsApp reminders."
                action={canAdd ? <Button variant="primary" icon={<Plus size={14} />} onClick={openAdd}>Add first customer</Button> : undefined}
              />
            ) : (
              <EmptyState
                icon={<Users size={28} />}
                title="No customers match your filters"
                description="Try a different search term or clear the dues filter."
                action={<Button variant="secondary" size="sm" onClick={() => { setSearch(''); setDuesFilter(''); }}>Clear filters</Button>}
                compact
              />
            )
          }
          onRowClick={openDetail}
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={pagination.setPage}
          sortState={pagination.sortState}
          onSort={pagination.toggleSort}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
        />}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {loading ? <CardListSkeleton rows={4} showAvatar /> : pagination.pageData.map(c => (
          <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <button type="button" onClick={() => openDetail(c)} className="block w-full text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                  {initial(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} /> {c.phone}</p>
                </div>
                <div className="text-right shrink-0">
                  {c.pendingAmount > 0
                    ? <p className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">{formatCurrency(c.pendingAmount)}</p>
                    : <Badge variant="success">Cleared</Badge>}
                  {lastPayments.get(c.id) && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      paid {formatRelativeTime(lastPayments.get(c.id)!)}
                    </p>
                  )}
                </div>
              </div>
            </button>
            {(canEdit || c.pendingAmount > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
                {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={12} />} onClick={() => openEdit(c)} className="flex-1">Edit</Button>}
                {c.pendingAmount > 0 && <Button variant="ghost" size="sm" icon={<Share2 size={12} />} onClick={() => sendWhatsAppReminder(c)} className="flex-1">Remind</Button>}
                {canEdit && c.pendingAmount > 0 && <Button variant="primary" size="sm" onClick={() => requestSettle(c)} className="flex-1">Settle</Button>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Customer Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add customer">
        <div className="space-y-4">
          <Input label="Name *" placeholder="e.g. Ramesh Kumar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={formError.name} />
          <Input label="Phone *" placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} error={formError.phone} />
          <Input label="Address (optional)" placeholder="Shop or home address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save customer</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit customer">
        <div className="space-y-4">
          <Input label="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={formError.name} />
          <Input label="Phone *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} error={formError.phone} />
          <Input label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSave}>Save changes</Button>
          </div>
        </div>
      </Modal>

      {/* Customer Details Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xl shrink-0">
                {initial(selected.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{selected.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1.5"><Phone size={13} /> {selected.phone}</p>
                {selected.address && <p className="text-xs text-gray-400 mt-1">{selected.address}</p>}
              </div>
              <div className="text-right shrink-0">
                {selected.pendingAmount > 0
                  ? <p className="text-amber-600 dark:text-amber-400 font-bold tabular-nums text-xl">{formatCurrency(selected.pendingAmount)}</p>
                  : <Badge variant="success">Cleared</Badge>}
                <p className="text-xs text-gray-500 mt-1">Total spent: {formatCurrency(customerTotalSpent)}</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {canEdit && <Button variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => { setSelected(null); openEdit(selected); }}>Edit</Button>}
              {selected.pendingAmount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Share2 size={13} />}
                  onClick={() => sendWhatsAppReminder(selected)}
                >
                  WhatsApp Reminder
                </Button>
              )}
              {canEdit && selected.pendingAmount > 0 && (
                <Button variant="primary" size="sm" onClick={() => { requestSettle(selected); setSelected(null); }}>Clear payment</Button>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Bills history ({customerBills.length})</p>
              {customerBills.length === 0 ? (
                <Card><p className="text-center text-sm text-gray-500 py-4">No bills yet.</p></Card>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  {customerBills.map(b => (
                    <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-mono text-xs text-gray-500">{b.id}</p>
                        <p className="text-xs text-gray-500">{formatDate(b.date)} · {b.items.length} item{b.items.length === 1 ? '' : 's'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(b.total)}</p>
                        {b.isUdhaar && !b.paid ? <Badge variant="warning">Udhaar</Badge> : <Badge variant="success">Paid</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Security Code Modal */}
      <Modal open={securityOpen} onClose={() => { setSecurityOpen(false); setSettleTarget(null); }} title="Confirm Payment" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Security verification required</p>
              <p className="text-xs text-gray-500 mt-0.5">Enter the security code to clear dues.</p>
            </div>
          </div>
          {settleTarget && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">Clearing dues for</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{settleTarget.name}</p>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums mt-1">{formatCurrency(settleTarget.pendingAmount)}</p>
            </div>
          )}
          <Input
            label="Security code"
            type="password"
            value={securityInput}
            onChange={e => { setSecurityInput(e.target.value); setSecurityError(''); }}
            placeholder="Enter security code"
            error={securityError}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setSecurityOpen(false); setSettleTarget(null); }}>Cancel</Button>
            <Button variant="primary" onClick={confirmSettle}>Confirm & settle</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
