import { useState, useMemo } from 'react';
import { Eye, Phone } from 'lucide-react';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Dropdown } from '../../components/ui/Dropdown';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { bills as initialBills, customers } from '../../data/shop-dummy';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { usePagination } from '../../hooks/usePagination';
import type { Bill } from '../../types';

type DateRange = '' | 'today' | '7d' | '30d';
type StatusFilter = '' | 'paid' | 'udhaar';

const isWithinRange = (dateStr: string, range: DateRange) => {
  if (!range) return true;
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now);
  if (range === 'today') start.setHours(0, 0, 0, 0);
  else if (range === '7d') start.setDate(now.getDate() - 7);
  else if (range === '30d') start.setDate(now.getDate() - 30);
  return d >= start;
};

export function ShopBillsHistory() {
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [selected, setSelected] = useState<Bill | null>(null);
  const { addToast } = useToast();
  const { can } = usePermissions();

  const canEdit = can('bills', 'edit');

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
    pageSize: 5,
    sortFns: {
      date: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      total: (a, b) => a.total - b.total,
    },
  });

  const markAsPaid = (bill: Bill) => {
    setBills(prev => prev.map(b => (b.id === bill.id ? { ...b, paid: true } : b)));
    setSelected(prev => (prev && prev.id === bill.id ? { ...prev, paid: true } : prev));
    addToast('success', 'Bill marked as paid');
  };

  const renderStatus = (b: Bill) => b.isUdhaar && !b.paid ? <Badge variant="warning">Udhaar</Badge> : <Badge variant="success">Paid</Badge>;

  const selectedCustomer = useMemo(() => {
    if (!selected?.customerId) return null;
    return customers.find(c => c.id === selected.customerId) || null;
  }, [selected]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bills History</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage all past transactions.</p>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <SearchInput placeholder="Search by bill ID or customer..." value={search} onSearch={setSearch} />
          <Dropdown options={[{ label: 'All time', value: '' }, { label: 'Today', value: 'today' }, { label: 'Last 7 days', value: '7d' }, { label: 'Last 30 days', value: '30d' }]} value={range} onChange={e => setRange(e.target.value as DateRange)} />
          <Dropdown options={[{ label: 'All statuses', value: '' }, { label: 'Paid', value: 'paid' }, { label: 'Pending Udhaar', value: 'udhaar' }]} value={status} onChange={e => setStatus(e.target.value as StatusFilter)} />
        </div>
      </Card>

      <div className="hidden sm:block">
        <Table
          columns={[
            { key: 'id', header: 'Bill ID', render: b => <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{b.id}</span> },
            { key: 'date', header: 'Date', sortable: true, render: b => <span className="text-gray-600 dark:text-gray-400">{formatDate(b.date)}</span> },
            { key: 'customer', header: 'Customer', render: b => <span className="font-medium text-gray-900 dark:text-white">{b.customerName}</span> },
            { key: 'items', header: 'Items', render: b => <span className="text-gray-500 tabular-nums">{b.items.length}</span> },
            { key: 'total', header: 'Total', sortable: true, render: b => <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCurrency(b.total)}</span> },
            { key: 'status', header: 'Status', render: renderStatus },
            { key: 'actions', header: '', className: 'text-right', render: b => <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={e => { e.stopPropagation(); setSelected(b); }}>View</Button> },
          ]}
          data={pagination.pageData}
          keyExtractor={b => b.id}
          emptyMessage="No bills found"
          onRowClick={b => setSelected(b)}
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
        {pagination.pageData.map(b => (
          <button key={b.id} type="button" onClick={() => setSelected(b)} className="block w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-gray-500">{b.id}</span>
              {renderStatus(b)}
            </div>
            <p className="mt-2 font-medium text-gray-900 dark:text-white">{b.customerName}</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">{formatCurrency(b.total)}</span>
              <span className="text-xs text-gray-500">{formatDate(b.date)}</span>
            </div>
          </button>
        ))}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Bill details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs text-gray-500">Bill ID</p><p className="font-mono text-sm text-gray-900 dark:text-white">{selected.id}</p></div>
              <div className="text-right"><p className="text-xs text-gray-500">Date</p><p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(selected.date)}</p></div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-medium text-gray-900 dark:text-white">{selected.customerName}</p>
              {selectedCustomer && <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1"><Phone size={12} /> {selectedCustomer.phone}</p>}
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {selected.items.map(it => (
                    <tr key={it.id}>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-white">{it.name}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">{it.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">{formatCurrency(it.price)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-900 dark:text-white tabular-nums">{formatCurrency(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              <div>{renderStatus(selected)}</div>
              <div className="text-right"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(selected.total)}</p></div>
            </div>
            {canEdit && selected.isUdhaar && !selected.paid && <Button variant="primary" size="lg" onClick={() => markAsPaid(selected)} className="w-full">Mark as paid</Button>}
          </div>
        )}
      </Modal>
    </div>
  );
}
