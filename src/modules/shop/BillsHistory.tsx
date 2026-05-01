import { useEffect, useState, useMemo } from 'react';
import { Eye, Phone, Printer, IndianRupee, Receipt, Clock, Banknote, Smartphone, CreditCard as CardIcon } from 'lucide-react';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Dropdown } from '../../components/ui/Dropdown';
import { Card, StatCard } from '../../components/ui/Card';
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
import { usePagination } from '../../hooks/usePagination';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import type { Bill } from '../../types';
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

  const pagination = usePagination({
    data: filtered,
    pageSize: 8,
    sortFns: {
      date: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      total: (a, b) => a.total - b.total,
    },
  });

  const summaryStats = useMemo(() => {
    const total = filtered.reduce((s, b) => s + b.total, 0);
    const paid = filtered.filter(b => b.paid).reduce((s, b) => s + b.total, 0);
    const pending = filtered.filter(b => b.isUdhaar && !b.paid).reduce((s, b) => s + b.total, 0);
    return { total, paid, pending, count: filtered.length };
  }, [filtered]);

  const markAsPaid = (bill: Bill) => {
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, paid: true } : b));
    setSelected(prev => prev && prev.id === bill.id ? { ...prev, paid: true } : prev);
    addToast('success', 'Bill marked as paid');
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bills History</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage all past transactions.</p>
        </div>
        <ExportMenu<Bill>
          baseName="bills"
          title="Bills history export"
          meta={`${filtered.length} of ${bills.length} bills`}
          columns={BILL_EXPORT_COLUMNS}
          rows={filtered}
          size="md"
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Bills" value={String(summaryStats.count)} icon={<Receipt size={18} />} />
        <StatCard title="Total Revenue" value={formatCurrency(summaryStats.total)} icon={<IndianRupee size={18} />} />
        <StatCard title="Collected" value={formatCurrency(summaryStats.paid)} icon={<Banknote size={18} />} trend="Paid bills" trendUp />
        <StatCard title="Pending" value={formatCurrency(summaryStats.pending)} icon={<Clock size={18} />} trend="Udhaar dues" trendUp={false} />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_180px]">
          <SearchInput placeholder="Search by bill ID or customer..." value={search} onSearch={setSearch} />
          <Dropdown
            options={[
              { label: 'All time', value: '' },
              { label: 'Today', value: 'today' },
              { label: 'Last 7 days', value: '7d' },
              { label: 'Last 30 days', value: '30d' },
            ]}
            value={range}
            onChange={e => setRange(e.target.value as DateRange)}
          />
          <Dropdown
            options={[
              { label: 'All statuses', value: '' },
              { label: 'Paid', value: 'paid' },
              { label: 'Pending Udhaar', value: 'udhaar' },
            ]}
            value={status}
            onChange={e => setStatus(e.target.value as StatusFilter)}
          />
        </div>
      </Card>

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
          data={pagination.pageData}
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
        {loading ? <CardListSkeleton rows={4} /> : <div className="animate-fade-in-up space-y-3">{pagination.pageData.map(b => (
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
    </div>
  );
}
