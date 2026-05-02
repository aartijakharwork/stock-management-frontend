import { useEffect, useState, useMemo, useRef } from 'react';
import { Eye, Phone, Printer, IndianRupee, Receipt, Clock, Banknote, Smartphone, CreditCard as CardIcon } from 'lucide-react';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Card } from '../../components/ui/Card';
import { CompactStat } from '../../components/ui/CompactStat';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExportMenu } from '../../components/ui/ExportMenu';
import { CardListSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { bills as initialBills, customers } from '../../data/shop-dummy';
import { formatCurrency, formatDate, formatInvoiceNo, gstBreakdown, formatRelativeTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { getSecuritySettings } from '../../utils/security';
import { Input } from '../../components/ui/Input';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import type { Bill, SortState } from '../../types';
import type { ExportColumn } from '../../utils/exporters';

type DateRange = '' | 'today' | '7d' | '30d';
type StatusFilter = '' | 'paid' | 'udhaar';

const TODAY = '2026-04-25';

const billStatusLabel = (b: Bill) => b.isUdhaar && !b.paid ? 'Udhaar' : b.isUdhaar && b.paid ? 'Settled' : 'Paid';

const BILL_EXPORT_COLUMNS: ExportColumn<Bill>[] = [
  { header: 'Invoice No.', accessor: b => formatInvoiceNo(b.id, b.date) },
  { header: 'Internal Ref', accessor: b => b.id },
  { header: 'Date', accessor: b => formatDate(b.date) },
  { header: 'Customer', accessor: b => b.customerName },
  { header: 'Items', accessor: b => b.items.length },
  { header: 'Subtotal (₹)', accessor: b => b.subtotal ?? b.total },
  { header: 'Discount (₹)', accessor: b => b.discount ?? 0 },
  {
    header: 'Taxable (₹)',
    accessor: b => gstBreakdown(b.total).taxable,
  },
  {
    header: 'CGST (₹)',
    accessor: b => gstBreakdown(b.total).cgst,
  },
  {
    header: 'SGST (₹)',
    accessor: b => gstBreakdown(b.total).sgst,
  },
  { header: 'Total (₹)', accessor: b => b.total },
  { header: 'Payment', accessor: b => b.paymentMethod ?? (b.isUdhaar ? 'udhaar' : 'cash') },
  { header: 'Status', accessor: b => billStatusLabel(b) },
];

const isWithinRange = (dateStr: string, range: DateRange) => {
  if (!range) return true;
  const d = new Date(dateStr);
  const now = new Date(TODAY);
  const start = new Date(now);
  if (range === 'today') start.setHours(0, 0, 0, 0);
  else if (range === '7d') start.setDate(now.getDate() - 7);
  else if (range === '30d') start.setDate(now.getDate() - 30);
  return d >= start;
};

const paymentIcon = (method?: string) => {
  if (method === 'upi') return <Smartphone size={12} className="inline mr-1" />;
  if (method === 'card') return <CardIcon size={12} className="inline mr-1" />;
  return <Banknote size={12} className="inline mr-1" />;
};

export function ShopBillsHistory() {
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [selected, setSelected] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [securityTarget, setSecurityTarget] = useState<Bill | null>(null);
  const [securityInput, setSecurityInput] = useState('');
  const [securityError, setSecurityError] = useState('');
  const { addToast } = useToast();
  const { can } = usePermissions();
  const { track } = useRecentlyViewed();
  const canEdit = can('bills', 'edit');

  const openBill = (b: Bill) => {
    setSelected(b);
    track({
      kind: 'bill',
      id: b.id,
      label: formatInvoiceNo(b.id, b.date),
      sublabel: `${b.customerName} · ${formatCurrency(b.total)}`,
      to: '/shop/bills',
    });
  };

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter(b => {
      const matchesSearch = !q || b.id.toLowerCase().includes(q) || b.customerName.toLowerCase().includes(q);
      const matchesStatus = !status || (status === 'paid' && b.paid) || (status === 'udhaar' && b.isUdhaar && !b.paid);
      return matchesSearch && matchesStatus && isWithinRange(b.date, range);
    });
  }, [bills, search, status, range]);

  const [sortState, setSortState] = useState<SortState | null>(null);
  const sortFns: Record<string, (a: Bill, b: Bill) => number> = {
    date: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    total: (a, b) => a.total - b.total,
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
  useEffect(() => { setDisplayCount(PAGE); }, [search, status, range, sortState, bills.length]);
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

  const summaryStats = useMemo(() => {
    const total = filtered.reduce((s, b) => s + b.total, 0);
    const paid = filtered.filter(b => b.paid).reduce((s, b) => s + b.total, 0);
    const pending = filtered.filter(b => b.isUdhaar && !b.paid).reduce((s, b) => s + b.total, 0);
    return { total, paid, pending, count: filtered.length };
  }, [filtered]);

  const doMarkAsPaid = (bill: Bill) => {
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, paid: true } : b));
    setSelected(prev => prev && prev.id === bill.id ? { ...prev, paid: true } : prev);
    addToast('success', 'Bill marked as paid');
  };

  const markAsPaid = (bill: Bill) => {
    const security = getSecuritySettings();
    if (security.enabled && security.code) {
      setSecurityTarget(bill);
      setSecurityInput('');
      setSecurityError('');
      setSecurityOpen(true);
      return;
    }
    doMarkAsPaid(bill);
  };

  const confirmMarkAsPaid = () => {
    const security = getSecuritySettings();
    if (securityInput !== security.code) {
      setSecurityError('Invalid security code');
      return;
    }
    if (!securityTarget) return;
    doMarkAsPaid(securityTarget);
    setSecurityOpen(false);
    setSecurityTarget(null);
  };

  const renderStatus = (b: Bill) => {
    if (b.isUdhaar && !b.paid) return <Badge variant="warning">Udhaar</Badge>;
    if (b.isUdhaar && b.paid) return <Badge variant="success">Settled</Badge>;
    return <Badge variant="success">Paid</Badge>;
  };

  const selectedCustomer = useMemo(() => {
    if (!selected?.customerId) return null;
    return customers.find(c => c.id === selected.customerId) || null;
  }, [selected]);

  return (
    <div className="space-y-3">
      {/* Title row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bills History</h1>
        <ExportMenu<Bill>
          baseName="bills"
          title="Bills history export"
          meta={`${filtered.length} of ${bills.length} bills`}
          columns={BILL_EXPORT_COLUMNS}
          rows={filtered}
          size="sm"
        />
      </div>

      {/* Compact stat tiles */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <CompactStat
          icon={<Receipt size={16} />}
          tone="emerald"
          title="Total bills"
          value={String(summaryStats.count)}
        />
        <CompactStat
          icon={<IndianRupee size={16} />}
          tone="blue"
          title="Total revenue"
          value={formatCurrency(summaryStats.total)}
        />
        <CompactStat
          icon={<Banknote size={16} />}
          tone="emerald"
          title="Collected"
          value={formatCurrency(summaryStats.paid)}
          subtitle="Paid bills"
          subtitleTone="good"
        />
        <CompactStat
          icon={<Clock size={16} />}
          tone={summaryStats.pending > 0 ? 'amber' : 'gray'}
          title="Pending"
          value={formatCurrency(summaryStats.pending)}
          subtitle={summaryStats.pending > 0 ? 'Udhaar dues' : 'All collected'}
          subtitleTone={summaryStats.pending > 0 ? 'warn' : 'good'}
          onClick={summaryStats.pending > 0 ? () => setStatus('udhaar') : undefined}
        />
      </div>

      {/* Single-row filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <SearchInput placeholder="Search by bill ID or customer..." value={search} onSearch={setSearch} />
        </div>
        <div className="sm:w-40">
          <SearchableSelect
            value={range}
            onChange={(v) => setRange(v as DateRange)}
            options={[
              { label: 'All time', value: '' },
              { label: 'Today', value: 'today' },
              { label: 'Last 7 days', value: '7d' },
              { label: 'Last 30 days', value: '30d' },
            ]}
            placeholder="All time"
            clearable={!!range}
          />
        </div>
        <div className="sm:w-44">
          <SearchableSelect
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
            options={[
              { label: 'All statuses', value: '' },
              { label: 'Paid', value: 'paid' },
              { label: 'Pending Udhaar', value: 'udhaar' },
            ]}
            placeholder="All statuses"
            clearable={!!status}
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        {loading ? <TableSkeleton rows={6} columns={6} /> : <div className="animate-fade-in-up"><Table
          columns={[
            { key: 'id', header: 'Invoice', render: b => <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{formatInvoiceNo(b.id, b.date)}</span> },
            {
              key: 'date',
              header: 'Date',
              sortable: true,
              render: b => (
                <div title={formatDate(b.date)}>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(b.date)}</p>
                  <p className="text-[11px] text-gray-400">{formatRelativeTime(b.date)}</p>
                </div>
              ),
            },
            {
              key: 'customer',
              header: 'Customer',
              render: b => <span className="font-medium text-gray-900 dark:text-white">{b.customerName}</span>,
            },
            {
              key: 'items',
              header: 'Items',
              render: b => <span className="text-gray-500 tabular-nums">{b.items.length}</span>,
            },
            {
              key: 'total',
              header: 'Total',
              sortable: true,
              render: b => <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCurrency(b.total)}</span>,
            },
            {
              key: 'payment',
              header: 'Payment',
              render: b => b.isUdhaar
                ? <Badge variant="warning">Udhaar</Badge>
                : <span className="text-xs text-gray-500 capitalize">{paymentIcon(b.paymentMethod)}{b.paymentMethod || 'cash'}</span>,
            },
            { key: 'status', header: 'Status', render: renderStatus },
            {
              key: 'actions',
              header: '',
              className: 'text-right w-24',
              render: b => (
                <Button variant="ghost" size="sm" icon={<Eye size={13} />} onClick={e => { e.stopPropagation(); openBill(b); }}>View</Button>
              ),
            },
          ]}
          data={visible}
          keyExtractor={b => b.id}
          emptyState={
            bills.length === 0 ? (
              <EmptyState
                icon={<Receipt size={28} />}
                title="No bills yet"
                description="Generate your first bill from the POS to see it here."
                action={<Link to="/shop/billing"><Button variant="primary" icon={<Receipt size={14} />}>Open POS</Button></Link>}
              />
            ) : (
              <EmptyState
                icon={<Receipt size={28} />}
                title="No bills match your filters"
                description="Try a different date range, status, or search term."
                action={<Button variant="secondary" size="sm" onClick={() => { setSearch(''); setRange(''); setStatus(''); }}>Clear filters</Button>}
                compact
              />
            )
          }
          onRowClick={openBill}
          sortState={sortState}
          onSort={toggleSort}
        /></div>}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {loading ? <CardListSkeleton rows={4} /> : <div className="animate-fade-in-up space-y-3">{visible.map(b => (
          <button
            key={b.id}
            type="button"
            onClick={() => openBill(b)}
            className="block w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover-lift active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{formatInvoiceNo(b.id, b.date)}</span>
              {renderStatus(b)}
            </div>
            <p className="mt-2 font-medium text-gray-900 dark:text-white">{b.customerName}</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">{formatCurrency(b.total)}</span>
                {b.discount ? <span className="ml-2 text-xs text-gray-400">–{formatCurrency(b.discount)}</span> : null}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{formatDate(b.date)}</p>
                <p className="text-[10px] text-gray-400">{formatRelativeTime(b.date)}</p>
              </div>
            </div>
          </button>
        ))}</div>}
        {!loading && filtered.length === 0 && (
          <Card>
            <EmptyState
              icon={<Receipt size={26} />}
              title={bills.length === 0 ? 'No bills yet' : 'No bills match your filters'}
              description={bills.length === 0 ? 'Generate your first bill from the POS to see it here.' : 'Try a different filter.'}
              action={
                bills.length === 0
                  ? <Link to="/shop/billing"><Button variant="primary" size="sm" icon={<Receipt size={14} />}>Open POS</Button></Link>
                  : <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setRange(''); setStatus(''); }}>Clear filters</Button>
              }
              compact
            />
          </Card>
        )}
      </div>

      {/* Infinite-scroll sentinel + footer */}
      <div ref={sentinelRef} className="h-8" />
      {sorted.length > 0 && !loading && (
        <p className="text-center text-[11px] text-gray-400 -mt-2 mb-2 tabular-nums">
          {visible.length < sorted.length
            ? `Showing ${visible.length} of ${sorted.length} — scroll for more`
            : `${sorted.length} bill${sorted.length === 1 ? '' : 's'}`}
        </p>
      )}

      {/* Bill Details Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Bill details" size="lg">
        {selected && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">Tax Invoice</p>
                <p className="mt-0.5 font-mono text-base font-semibold text-gray-900 dark:text-white">{formatInvoiceNo(selected.id, selected.date)}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Internal ref · {selected.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(selected.date)}</p>
                <p className="text-[11px] text-gray-400">{formatRelativeTime(selected.date)}</p>
              </div>
            </div>

            {/* Customer */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-xs text-gray-500 mb-1">Customer</p>
              <p className="font-medium text-gray-900 dark:text-white">{selected.customerName}</p>
              {selectedCustomer && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                  <Phone size={12} /> {selectedCustomer.phone}
                </p>
              )}
            </div>

            {/* Items table */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {selected.items.map(it => (
                    <tr key={it.id}>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-white">{it.name}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">{it.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">{formatCurrency(it.price)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-900 dark:text-white tabular-nums font-medium">{formatCurrency(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-2">
              {selected.subtotal != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(selected.subtotal)}</span>
                </div>
              )}
              {(selected.discount ?? 0) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600">Discount</span>
                  <span className="text-emerald-600 tabular-nums">–{formatCurrency(selected.discount!)}</span>
                </div>
              )}
              {(() => {
                const tax = gstBreakdown(selected.total);
                return (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Taxable value</span>
                      <span className="text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(tax.taxable)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">CGST @ 9%</span>
                      <span className="text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(tax.cgst)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">SGST @ 9%</span>
                      <span className="text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(tax.sgst)}</span>
                    </div>
                  </>
                );
              })()}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">{renderStatus(selected)}</div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total (incl. GST)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(selected.total)}</p>
                </div>
              </div>
              {selected.paymentMethod && !selected.isUdhaar && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Payment via</span>
                  <span className="capitalize text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    {paymentIcon(selected.paymentMethod)}{selected.paymentMethod}
                  </span>
                </div>
              )}
              {selected.note && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Note</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selected.note}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" icon={<Printer size={14} />} onClick={() => window.print()} className="flex-1">Print</Button>
              {canEdit && selected.isUdhaar && !selected.paid && (
                <Button variant="primary" onClick={() => markAsPaid(selected)} className="flex-1">Mark as paid</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Security prompt — required when shopkeeper has set a settle PIN in Settings */}
      <Modal open={securityOpen} onClose={() => { setSecurityOpen(false); setSecurityTarget(null); setSecurityInput(''); setSecurityError(''); }} title="Confirm payment" size="sm">
        <form
          className="space-y-3"
          onSubmit={e => {
            e.preventDefault();
            confirmMarkAsPaid();
          }}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter your security code to mark this bill as paid.
          </p>
          {securityTarget && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/40">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Bill</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatInvoiceNo(securityTarget.id, securityTarget.date)} · {securityTarget.customerName}</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {formatCurrency(securityTarget.total)}
              </p>
            </div>
          )}
          <Input
            label="Security code"
            type="password"
            inputMode="numeric"
            value={securityInput}
            onChange={e => { setSecurityInput(e.target.value); setSecurityError(''); }}
            error={securityError || undefined}
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => { setSecurityOpen(false); setSecurityTarget(null); setSecurityInput(''); setSecurityError(''); }}>Cancel</Button>
            <Button variant="primary" type="submit">Confirm</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
