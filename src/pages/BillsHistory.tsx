import { useState, useMemo } from 'react';
import { Eye, Phone } from 'lucide-react';
import { SearchInput } from '../components/ui/SearchInput';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Dropdown } from '../components/ui/Dropdown';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { bills as initialBills, customers } from '../data/dummy';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Bill } from '../types';

type DateRange = '' | 'today' | '7d' | '30d';
type StatusFilter = '' | 'paid' | 'udhaar';

const isWithinRange = (dateStr: string, range: DateRange) => {
  if (!range) return true;
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now);
  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    start.setDate(now.getDate() - 7);
  } else if (range === '30d') {
    start.setDate(now.getDate() - 30);
  }
  return d >= start;
};

export function BillsHistory() {
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [selected, setSelected] = useState<Bill | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter(b => {
      const matchesSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q);
      const matchesStatus =
        !status ||
        (status === 'paid' && b.paid) ||
        (status === 'udhaar' && b.isUdhaar && !b.paid);
      const matchesDate = isWithinRange(b.date, range);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bills, search, status, range]);

  const markAsPaid = (bill: Bill) => {
    if (!confirm(`Mark bill ${bill.id} as paid?`)) return;
    setBills(prev =>
      prev.map(b => (b.id === bill.id ? { ...b, paid: true } : b))
    );
    setSelected(prev => (prev && prev.id === bill.id ? { ...prev, paid: true } : prev));
  };

  const renderStatus = (b: Bill) => {
    if (b.isUdhaar && !b.paid) return <Badge variant="warning">Udhaar</Badge>;
    return <Badge variant="success">Paid</Badge>;
  };

  const selectedCustomer = useMemo(() => {
    if (!selected?.customerId) return null;
    return customers.find(c => c.id === selected.customerId) || null;
  }, [selected]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
          Recent transactions
        </p>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">Bills History</h1>
      </header>

      <Card>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <SearchInput
            placeholder="Search by bill ID or customer name..."
            value={search}
            onSearch={setSearch}
          />
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

      {/* Mobile card list */}
      <div className="space-y-3 sm:hidden">
        {filtered.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">
              No bills found.
            </p>
          </Card>
        ) : (
          filtered.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelected(b)}
              className="block w-full text-left rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-sm p-4 transition-colors hover:border-gray-300 dark:hover:border-white/20 cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{b.id}</span>
                {renderStatus(b)}
              </div>
              <div className="mt-2">
                <p className="text-gray-900 dark:text-white font-semibold truncate">
                  {b.customerName}
                </p>
                <p className="text-xs text-gray-500">
                  {b.items.length} item{b.items.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <span className="text-cyan-700 dark:text-cyan-300 font-semibold tabular-nums">
                  {formatCurrency(b.total)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  {formatDate(b.date)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Table
          columns={[
            {
              key: 'id',
              header: 'Bill ID',
              render: b => (
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{b.id}</span>
              ),
            },
            {
              key: 'date',
              header: 'Date',
              render: b => (
                <span className="text-gray-700 dark:text-gray-300">{formatDate(b.date)}</span>
              ),
            },
            {
              key: 'customer',
              header: 'Customer',
              render: b => (
                <span className="text-gray-900 dark:text-white font-medium">{b.customerName}</span>
              ),
            },
            {
              key: 'items',
              header: 'Items',
              render: b => (
                <span className="text-gray-600 dark:text-gray-400 tabular-nums">
                  {b.items.length}
                </span>
              ),
            },
            {
              key: 'total',
              header: 'Total',
              render: b => (
                <span className="text-cyan-700 dark:text-cyan-300 font-semibold tabular-nums">
                  {formatCurrency(b.total)}
                </span>
              ),
            },
            { key: 'status', header: 'Status', render: renderStatus },
            {
              key: 'actions',
              header: '',
              render: b => (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Eye size={14} />}
                  onClick={e => {
                    e.stopPropagation();
                    setSelected(b);
                  }}
                >
                  View
                </Button>
              ),
              className: 'text-right',
            },
          ]}
          data={filtered}
          keyExtractor={b => b.id}
          emptyMessage="No bills found"
          onRowClick={b => setSelected(b)}
        />
      </div>

      {/* Bill detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Bill details"
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  Bill ID
                </p>
                <p className="font-mono text-sm text-gray-900 dark:text-white mt-0.5">
                  {selected.id}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  Date
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                  {formatDate(selected.date)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                Customer
              </p>
              <p className="text-gray-900 dark:text-white font-semibold mt-1">
                {selected.customerName}
              </p>
              {selectedCustomer && (
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                  <Phone size={12} /> {selectedCustomer.phone}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500">
                      Item
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500">
                      Price
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map(it => (
                    <tr
                      key={it.id}
                      className="border-b border-gray-200 dark:border-white/5 last:border-b-0"
                    >
                      <td className="px-4 py-2.5 text-gray-900 dark:text-white">{it.name}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                        {it.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                        {formatCurrency(it.price)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(it.price * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/5 pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  Status
                </p>
                <div className="mt-1">{renderStatus(selected)}</div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">
                  {formatCurrency(selected.total)}
                </p>
              </div>
            </div>

            {selected.isUdhaar && !selected.paid && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => markAsPaid(selected)}
                className="w-full"
              >
                Mark as paid
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
