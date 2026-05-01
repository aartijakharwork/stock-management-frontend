import { useEffect, useState, useMemo } from 'react';
import {
  Plus, Phone, Eye, CircleDollarSign, Users, AlertCircle,
  ShieldCheck, Share2, Pencil, BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { Highlight } from '../../components/ui/Highlight';
import { Checkbox } from '../../components/ui/Checkbox';
import { customers as initialCustomers, bills as initialBills } from '../../data/shop-dummy';
import { formatCurrency, formatDate, formatRelativeTime, generateId } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { usePagination } from '../../hooks/usePagination';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { customerAging, AGING_TONES, customerHealth, HEALTH_TONES } from '../../utils/customerAging';
import type { AgingBucket } from '../../utils/customerAging';
import type { Bill, Customer } from '../../types';
import type { ExportColumn } from '../../utils/exporters';

type DuesFilter = '' | 'with' | 'cleared' | AgingBucket;

function getSecuritySettings() {
  const enabled = localStorage.getItem('shopmanager.security.enabled') === 'true';
  const code = localStorage.getItem('shopmanager.security.code') || '';
  return { enabled: enabled && code.length > 0, code };
}

interface CustomerFormState {
  name: string;
  phone: string;
  address: string;
  area: string;
  pincode: string;
  email: string;
}

const emptyForm: CustomerFormState = {
  name: '', phone: '', address: '', area: '', pincode: '', email: '',
};

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
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const [formError, setFormError] = useState<{ name?: string; phone?: string }>({});
  const [selected, setSelected] = useState<Customer | null>(null);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState<Customer | null>(null);
  const [securityInput, setSecurityInput] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { can } = usePermissions();
  const { track } = useRecentlyViewed();
  const navigate = useNavigate();

  const openDetail = (c: Customer) => {
    setSelected(c);
    track({
      kind: 'customer',
      id: c.id,
      label: c.name,
      sublabel: c.pendingAmount > 0
        ? `Udhaar ${formatCurrency(c.pendingAmount)}`
        : 'All cleared',
      to: `/shop/customers/${c.id}`,
    });
  };

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const canAdd = can('customers', 'add');
  const canEdit = can('customers', 'edit');

  const agingMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof customerAging>>();
    customersList.forEach(c => m.set(c.id, customerAging(c, bills)));
    return m;
  }, [customersList, bills]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customersList.filter(c => {
      const matchesSearch = !q
        || c.name.toLowerCase().includes(q)
        || c.phone.includes(q)
        || (c.area?.toLowerCase().includes(q) ?? false);
      const aging = agingMap.get(c.id);
      const matchesDues = !duesFilter
        || (duesFilter === 'with' && c.pendingAmount > 0)
        || (duesFilter === 'cleared' && c.pendingAmount === 0)
        || (aging && aging.bucket === duesFilter);
      return matchesSearch && matchesDues;
    });
  }, [customersList, search, duesFilter, agingMap]);

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

  const agingTotals = useMemo(() => {
    const totals: Record<AgingBucket, { count: number; amount: number }> = {
      '0-30':  { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+':   { count: 0, amount: 0 },
    };
    customersList.forEach(c => {
      const a = agingMap.get(c.id);
      if (a && c.pendingAmount > 0) {
        totals[a.bucket].count += 1;
        totals[a.bucket].amount += c.pendingAmount;
      }
    });
    return totals;
  }, [customersList, agingMap]);

  const lastPayments = useMemo(() => lastPaymentMap(bills), [bills]);

  const exportColumns = useMemo<ExportColumn<Customer>[]>(() => [
    { header: 'Name', accessor: c => c.name },
    { header: 'Phone', accessor: c => c.phone },
    { header: 'Address', accessor: c => c.address || '' },
    { header: 'Pending (₹)', accessor: c => c.pendingAmount },
    { header: 'Aging', accessor: c => agingMap.get(c.id)?.bucket ?? '' },
    { header: 'Status', accessor: c => customerStatus(c) },
    {
      header: 'Last paid',
      accessor: c => {
        const d = lastPayments.get(c.id);
        return d ? formatDate(d) : '—';
      },
    },
  ], [lastPayments, agingMap]);

  const openAdd = () => { setForm(emptyForm); setFormError({}); setAddOpen(true); };
  const openEdit = (c: Customer) => {
    setEditTarget(c);
    setForm({
      name: c.name,
      phone: c.phone,
      address: c.address || '',
      area: c.area || '',
      pincode: c.pincode || '',
      email: c.email || '',
    });
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

  const buildFromForm = (): Omit<Customer, 'id' | 'pendingAmount' | 'gstin' | 'creditLimit' | 'tags'> & {
    gstin?: undefined;
    creditLimit?: undefined;
    tags?: undefined;
  } => ({
    name: form.name.trim(),
    phone: form.phone.trim(),
    address: form.address.trim() || undefined,
    area: form.area.trim() || undefined,
    pincode: form.pincode.trim() || undefined,
    email: form.email.trim() || undefined,
    gstin: undefined,
    creditLimit: undefined,
    tags: undefined,
  });

  const handleSave = () => {
    if (!validateForm()) return;
    setCustomers(prev => [...prev, { id: generateId(), pendingAmount: 0, ...buildFromForm() }]);
    setAddOpen(false);
    addToast('success', 'Customer added');
  };

  const handleEditSave = () => {
    if (!validateForm() || !editTarget) return;
    const updated = buildFromForm();
    setCustomers(prev => prev.map(c => c.id === editTarget.id ? { ...c, ...updated } : c));
    if (selected?.id === editTarget.id) setSelected(prev => prev ? { ...prev, ...updated } : null);
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

  const toggleSelectCust = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allCustSelected = pagination.pageData.length > 0 && pagination.pageData.every(c => selectedIds.has(c.id));
  const someCustSelected = pagination.pageData.some(c => selectedIds.has(c.id));
  const toggleSelectAllCust = () => {
    if (allCustSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(pagination.pageData.map(c => c.id)));
  };
  const bulkSendReminder = () => {
    const selected = customersList.filter(c => selectedIds.has(c.id) && c.pendingAmount > 0);
    if (selected.length === 0) { addToast('warning', 'No selected customers have pending dues'); return; }
    selected.forEach(c => sendWhatsAppReminder(c));
    addToast('success', `Opened WhatsApp for ${selected.length} customer${selected.length === 1 ? '' : 's'}`);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customers, track udhaar, and watch overdue debts.</p>
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
          trendUp
        />
      </div>

      {/* Aging buckets */}
      {totalPending > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Udhaar aging</h3>
            <p className="text-xs text-gray-500">Click a bucket to filter</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['0-30', '31-60', '61-90', '90+'] as AgingBucket[]).map(bucket => {
              const t = AGING_TONES[bucket];
              const data = agingTotals[bucket];
              const active = duesFilter === bucket;
              return (
                <button
                  key={bucket}
                  onClick={() => setDuesFilter(active ? '' : bucket)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    active ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-gray-900' : ''
                  } ${t.bg} ${t.border}`}
                >
                  <p className={`text-xs font-medium ${t.text}`}>{t.label}</p>
                  <p className="text-lg font-bold mt-1 tabular-nums">{formatCurrency(data.amount)}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{data.count} customer{data.count === 1 ? '' : 's'}</p>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <SearchInput placeholder="Search by name, phone, area..." value={search} onSearch={setSearch} />
            <Dropdown
              options={[
                { label: 'All customers', value: '' },
                { label: `With dues (${dueCount})`, value: 'with' },
                { label: `Cleared (${clearedCount})`, value: 'cleared' },
                { label: `Aged 0-30d`, value: '0-30' },
                { label: `Aged 31-60d`, value: '31-60' },
                { label: `Aged 61-90d`, value: '61-90' },
                { label: `Aged 90+d`, value: '90+' },
              ]}
              value={duesFilter}
              onChange={e => setDuesFilter(e.target.value as DuesFilter)}
            />
          </div>
        </div>
      </Card>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 animate-fade-in-up">
          <Checkbox checked={allCustSelected} indeterminate={someCustSelected && !allCustSelected} onChange={toggleSelectAllCust} />
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <ExportMenu<Customer>
            baseName="customers-selected"
            title="Export selected"
            meta={`${selectedIds.size} customers`}
            columns={exportColumns}
            rows={customersList.filter(c => selectedIds.has(c.id))}
            size="sm"
          />
          <Button variant="secondary" size="sm" icon={<Share2 size={14} />} onClick={bulkSendReminder}>
            Remind ({customersList.filter(c => selectedIds.has(c.id) && c.pendingAmount > 0).length})
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Cancel</Button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block">
        {loading ? <TableSkeleton rows={6} columns={4} showAvatar /> : <div className="animate-fade-in-up"><Table
          columns={[
            {
              key: 'select',
              header: <Checkbox checked={allCustSelected} indeterminate={someCustSelected && !allCustSelected} onChange={toggleSelectAllCust} />,
              className: 'w-10',
              render: (c: Customer) => (
                <span onClick={e => e.stopPropagation()}>
                  <Checkbox checked={selectedIds.has(c.id)} onChange={() => toggleSelectCust(c.id)} />
                </span>
              ),
            },
            {
              key: 'name',
              header: 'Customer',
              sortable: true,
              render: c => {
                const aging = agingMap.get(c.id);
                const health = customerHealth(c, aging ?? null);
                const ht = HEALTH_TONES[health];
                return (
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 shrink-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                        {initial(c.name)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900 ${ht.bg}`} title={`Health: ${ht.label}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900 dark:text-white"><Highlight text={c.name} query={search} /></span>
                      </div>
                      {c.address && <p className="text-xs text-gray-400 truncate max-w-[180px]">{c.address}</p>}
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'phone',
              header: 'Phone',
              render: c => (
                <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                  <Phone size={13} /> <Highlight text={c.phone} query={search} />
                </a>
              ),
            },
            {
              key: 'pending',
              header: 'Pending',
              sortable: true,
              render: c => {
                const lastPaid = lastPayments.get(c.id);
                const aging = agingMap.get(c.id);
                return (
                  <div>
                    {c.pendingAmount > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{formatCurrency(c.pendingAmount)}</span>
                        {aging && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${AGING_TONES[aging.bucket].bg} ${AGING_TONES[aging.bucket].text}`}>
                            {AGING_TONES[aging.bucket].label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="success">Cleared</Badge>
                    )}
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
                  <Button variant="ghost" size="sm" icon={<BookOpen size={13} />} onClick={e => { e.stopPropagation(); navigate(`/shop/customers/${c.id}`); }}>Ledger</Button>
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
        /></div>}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {loading ? <CardListSkeleton rows={4} showAvatar /> : <div className="animate-fade-in-up space-y-3">{pagination.pageData.map(c => {
          const aging = agingMap.get(c.id);
          return (
            <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover-lift transition-transform">
              <button type="button" onClick={() => openDetail(c)} className="block w-full text-left">
                <div className="flex items-center gap-3">
                  <span className="shrink-0" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(c.id)} onChange={() => toggleSelectCust(c.id)} />
                  </span>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                    {initial(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                      <Highlight text={c.name} query={search} />
                    </p>
                    <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} /> {c.phone}</a>
                  </div>
                  <div className="text-right shrink-0">
                    {c.pendingAmount > 0
                      ? <p className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">{formatCurrency(c.pendingAmount)}</p>
                      : <Badge variant="success">Cleared</Badge>}
                    {aging && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${AGING_TONES[aging.bucket].bg} ${AGING_TONES[aging.bucket].text}`}>
                        {AGING_TONES[aging.bucket].label}
                      </span>
                    )}
                  </div>
                </div>
              </button>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
                <Button variant="ghost" size="sm" icon={<BookOpen size={12} />} onClick={() => navigate(`/shop/customers/${c.id}`)} className="flex-1">Ledger</Button>
                {c.pendingAmount > 0 && <Button variant="ghost" size="sm" icon={<Share2 size={12} />} onClick={() => sendWhatsAppReminder(c)} className="flex-1">Remind</Button>}
                {canEdit && c.pendingAmount > 0 && <Button variant="primary" size="sm" onClick={() => requestSettle(c)} className="flex-1">Settle</Button>}
              </div>
            </div>
          );
        })}</div>}
      </div>

      {/* Add Customer Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add customer" size="lg">
        <CustomerForm
          form={form}
          formError={formError}
          setForm={setForm}
          onCancel={() => setAddOpen(false)}
          onSave={handleSave}
          saveLabel="Save customer"
        />
      </Modal>

      {/* Edit Customer Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit customer" size="lg">
        <CustomerForm
          form={form}
          formError={formError}
          setForm={setForm}
          onCancel={() => setEditOpen(false)}
          onSave={handleEditSave}
          saveLabel="Save changes"
        />
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
                <p className="text-sm text-gray-500 flex items-center gap-1.5"><Phone size={13} /> <a href={`tel:${selected.phone}`} className="hover:text-emerald-600 dark:hover:text-emerald-400">{selected.phone}</a></p>
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
              <Button variant="secondary" size="sm" icon={<BookOpen size={13} />} onClick={() => { setSelected(null); navigate(`/shop/customers/${selected.id}`); }}>Open ledger</Button>
              {canEdit && <Button variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => { setSelected(null); openEdit(selected); }}>Edit</Button>}
              {selected.pendingAmount > 0 && (
                <Button variant="ghost" size="sm" icon={<Share2 size={13} />} onClick={() => sendWhatsAppReminder(selected)}>WhatsApp Reminder</Button>
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

interface CustomerFormProps {
  form: CustomerFormState;
  formError: { name?: string; phone?: string };
  setForm: React.Dispatch<React.SetStateAction<CustomerFormState>>;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}

function CustomerForm({ form, formError, setForm, onCancel, onSave, saveLabel }: CustomerFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Name *" placeholder="e.g. Ramesh Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={formError.name} />
        <Input label="Phone *" placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} error={formError.phone} />
      </div>
      <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="optional" />
      <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, area, city" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Area / Locality" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="Karol Bagh" />
        <Input label="Pin code" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="6-digit" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={onSave}>{saveLabel}</Button>
      </div>
    </div>
  );
}
