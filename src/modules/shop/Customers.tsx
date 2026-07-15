import { useEffect, useState, useMemo, useRef } from 'react';
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
import { Card } from '../../components/ui/Card';
import { CompactStat } from '../../components/ui/CompactStat';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExportMenu } from '../../components/ui/ExportMenu';
import { CardListSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { Highlight } from '../../components/ui/Highlight';
import { Checkbox } from '../../components/ui/Checkbox';
import { api } from '../../api/client';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { customerAging, AGING_TONES, customerHealth, HEALTH_TONES } from '../../utils/customerAging';
import type { AgingBucket } from '../../utils/customerAging';
import { getSecuritySettings } from '../../utils/security';
import type { Bill, Customer, SortState } from '../../types';
import type { ExportColumn } from '../../utils/exporters';

type DuesFilter = '' | 'with' | 'cleared' | AgingBucket;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCustomer(raw: any): Customer {
  return {
    ...raw,
    pendingAmount: raw.udhaarBalance ?? raw.pendingAmount ?? 0,
  };
}

const customerStatus = (c: Customer) => c.pendingAmount > 0 ? 'Pending' : 'Cleared';

export function ShopCustomers() {
  const [customersList, setCustomers] = useState<Customer[]>([]);
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
    let cancelled = false;
    (async () => {
      try {
        const res = await api('/shop/customers?limit=200');
        if (!cancelled && res.ok) {
          const data = await res.json();
          setCustomers((data.items ?? []).map(mapCustomer));
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const canAdd = can('customers', 'add');
  const canEdit = can('customers', 'edit');

  const agingMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof customerAging>>();
    customersList.forEach(c => m.set(c.id, customerAging(c, [])));
    return m;
  }, [customersList]);

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

  const [sortState, setSortState] = useState<SortState | null>(null);
  const sortFns: Record<string, (a: Customer, b: Customer) => number> = {
    name: (a, b) => a.name.localeCompare(b.name),
    pending: (a, b) => a.pendingAmount - b.pendingAmount,
  };
  const sorted = useMemo(() => {
    if (!sortState || !sortFns[sortState.key]) return filtered;
    const arr = [...filtered].sort(sortFns[sortState.key]);
    return sortState.direction === 'desc' ? arr.reverse() : arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sortState]);
  const toggleSort = (key: string) => {
    setSortState(prev => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const PAGE = 25;
  const [displayCount, setDisplayCount] = useState(PAGE);
  useEffect(() => { setDisplayCount(PAGE); }, [search, duesFilter, sortState, customersList.length]);
  const visible = sorted.slice(0, displayCount);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setDisplayCount(c => Math.min(c + PAGE, sorted.length));
      }
    }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [sorted.length, displayCount]);

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

  const lastPayments = useMemo(() => new Map<string, string>(), []);

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

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      const res = await api('/shop/customers', {
        method: 'POST',
        body: JSON.stringify(buildFromForm()),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to add customer' }));
        addToast('error', err.error || 'Failed to add customer');
        return;
      }
      const created = await res.json();
      setCustomers(prev => [...prev, mapCustomer(created)]);
      setAddOpen(false);
      addToast('success', 'Customer added');
    } catch {
      addToast('error', 'Network error');
    }
  };

  const handleEditSave = async () => {
    if (!validateForm() || !editTarget) return;
    try {
      const res = await api(`/shop/customers/${editTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify(buildFromForm()),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update' }));
        addToast('error', err.error || 'Failed to update');
        return;
      }
      const updated = mapCustomer(await res.json());
      setCustomers(prev => prev.map(c => c.id === editTarget.id ? updated : c));
      if (selected?.id === editTarget.id) setSelected(updated);
      setEditOpen(false);
      addToast('success', 'Customer updated');
    } catch {
      addToast('error', 'Network error');
    }
  };

  const doSettle = async (customer: Customer) => {
    try {
      const res = await api(`/shop/customers/${customer.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: customer.pendingAmount, method: 'cash' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to settle' }));
        addToast('error', err.error || 'Failed to settle dues');
        return;
      }
      const updated = mapCustomer(await res.json());
      setCustomers(prev => prev.map(c => c.id === customer.id ? updated : c));
      if (selected?.id === customer.id) setSelected(updated);
      addToast('success', 'Dues settled', `${formatCurrency(customer.pendingAmount)} received from ${customer.name}`);
    } catch {
      addToast('error', 'Network error');
    }
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

  const [customerBills, setCustomerBills] = useState<Bill[]>([]);
  const [customerTotalSpent, setCustomerTotalSpent] = useState(0);

  useEffect(() => {
    if (!selected) { setCustomerBills([]); setCustomerTotalSpent(0); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await api(`/shop/bills?customerId=${selected.id}&limit=20`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items = (data.items ?? []).map((b: any) => ({ ...b, date: b.createdAt || b.date }));
          setCustomerBills(items);
          setCustomerTotalSpent(items.reduce((s: number, b: Bill) => s + b.total, 0));
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [selected]);

  const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

  const toggleSelectCust = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allCustSelected = visible.length > 0 && visible.every(c => selectedIds.has(c.id));
  const someCustSelected = visible.some(c => selectedIds.has(c.id));
  const toggleSelectAllCust = () => {
    if (allCustSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(visible.map(c => c.id)));
  };
  const bulkSendReminder = () => {
    const selected = customersList.filter(c => selectedIds.has(c.id) && c.pendingAmount > 0);
    if (selected.length === 0) { addToast('warning', 'No selected customers have pending dues'); return; }
    selected.forEach(c => sendWhatsAppReminder(c));
    addToast('success', `Opened WhatsApp for ${selected.length} customer${selected.length === 1 ? '' : 's'}`);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-3">
      {/* Title row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportMenu<Customer>
            baseName="customers"
            title="Customers export"
            meta={`${filtered.length} of ${customersList.length} customers`}
            columns={exportColumns}
            rows={filtered}
            size="sm"
          />
          {canAdd && <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAdd}>Add customer</Button>}
        </div>
      </div>

      {/* Compact stat tiles */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <CompactStat
          icon={<Users size={16} />}
          tone="emerald"
          title="Total customers"
          value={String(customersList.length)}
        />
        <CompactStat
          icon={<CircleDollarSign size={16} />}
          tone={dueCount > 0 ? 'amber' : 'gray'}
          title="Pending udhaar"
          value={formatCurrency(totalPending)}
          subtitle={dueCount > 0 ? `${dueCount} customer${dueCount === 1 ? '' : 's'}` : 'All cleared'}
          subtitleTone={dueCount > 0 ? 'warn' : 'good'}
          onClick={dueCount > 0 ? () => setDuesFilter('with') : undefined}
        />
        <CompactStat
          icon={<AlertCircle size={16} />}
          tone="blue"
          title="Cleared"
          value={String(clearedCount)}
          subtitle={`${Math.round((clearedCount / Math.max(1, customersList.length)) * 100)}% of base`}
          subtitleTone="good"
        />
      </div>

      {/* Aging buckets — only when there's pending dues */}
      {totalPending > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Udhaar aging</h3>
            <p className="text-[10px] text-gray-400">Click a bucket to filter</p>
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
                  className={`px-3 py-2 rounded-lg border text-left transition-all ${
                    active ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-gray-950' : ''
                  } ${t.bg} ${t.border}`}
                >
                  <p className={`text-[10px] font-medium ${t.text}`}>{t.label}</p>
                  <p className="text-base font-bold mt-0.5 tabular-nums leading-tight">{formatCurrency(data.amount)}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{data.count} customer{data.count === 1 ? '' : 's'}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search bar — filters happen via stat tiles and aging buckets above */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <SearchInput placeholder="Search by name, phone, area..." value={search} onSearch={setSearch} />
        </div>
        {duesFilter && (
          <button
            onClick={() => setDuesFilter('')}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Clear filter
          </button>
        )}
      </div>

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
          data={visible}
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
          sortState={sortState}
          onSort={toggleSort}
        /></div>}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {loading ? <CardListSkeleton rows={4} showAvatar /> : <div className="animate-fade-in-up space-y-3">{visible.map(c => {
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

      {/* Infinite-scroll sentinel + footer */}
      <div ref={sentinelRef} className="h-8" />
      {sorted.length > 0 && !loading && (
        <p className="text-center text-[11px] text-gray-400 -mt-2 mb-2 tabular-nums">
          {visible.length < sorted.length
            ? `Showing ${visible.length} of ${sorted.length} — scroll for more`
            : `${sorted.length} customer${sorted.length === 1 ? '' : 's'}`}
        </p>
      )}

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
                <Button variant="primary" size="sm" onClick={() => requestSettle(selected)}>Clear payment</Button>
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
                        <p className="font-mono text-xs text-gray-500">{b.billNumber || b.id}</p>
                        <p className="text-xs text-gray-500">{formatDate(b.date)} · {b.items.length} item{b.items.length === 1 ? '' : 's'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(b.total)}</p>
                        {b.paymentStatus === 'unpaid' || b.paymentStatus === 'partial' ? <Badge variant="warning">Udhaar</Badge> : <Badge variant="success">Paid</Badge>}
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
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            confirmSettle();
          }}
        >
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
            <Button variant="secondary" type="button" onClick={() => { setSecurityOpen(false); setSettleTarget(null); }}>Cancel</Button>
            <Button variant="primary" type="submit">Confirm & settle</Button>
          </div>
        </form>
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
    <form
      className="space-y-4"
      onSubmit={e => {
        e.preventDefault();
        onSave();
      }}
    >
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
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">{saveLabel}</Button>
      </div>
    </form>
  );
}
