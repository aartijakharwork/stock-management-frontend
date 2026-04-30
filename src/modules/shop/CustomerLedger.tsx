import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Plus,
  CircleDollarSign,
  ReceiptText,
  Wallet,
  AlertTriangle,
  Pencil,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { ExportMenu } from '../../components/ui/ExportMenu';
import {
  customers as initialCustomers,
  bills as initialBills,
  ledgerEntries as initialLedger,
  activityEntries,
} from '../../data/shop-dummy';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import { customerAging, AGING_TONES, customerHealth, HEALTH_TONES } from '../../utils/customerAging';
import { useToast } from '../../context/ToastContext';
import type { LedgerEntry, PaymentMethod } from '../../types';
import type { ExportColumn } from '../../utils/exporters';

interface DerivedRow extends LedgerEntry {
  balance: number;
}

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'upi', 'card'];

export function ShopCustomerLedger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [ledger, setLedger] = useState<LedgerEntry[]>(initialLedger);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash' as PaymentMethod, note: '' });
  const [adjustForm, setAdjustForm] = useState({ amount: '', kind: 'credit' as 'credit' | 'debit', note: '' });

  const customer = initialCustomers.find(c => c.id === id);

  // Aggregate bills + ledger entries to compute running balance
  const customerBills = useMemo(() => initialBills.filter(b => b.customerId === id), [id]);

  const allEntries = useMemo(() => {
    const fromBills: LedgerEntry[] = customerBills.map(b => ({
      id: `bill-${b.id}`,
      customerId: id ?? '',
      date: b.date,
      kind: 'bill',
      description: `Bill ${b.id} · ${b.items.length} item${b.items.length === 1 ? '' : 's'}`,
      debit: b.isUdhaar && !b.paid ? b.total : 0,
      credit: 0,
      refId: b.id,
    }));
    const allRaw = [...fromBills, ...ledger.filter(l => l.customerId === id)];
    // sort ASC by date for running balance
    const sorted = [...allRaw].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    const withBalance: DerivedRow[] = sorted.map(e => {
      running += e.debit - e.credit;
      return { ...e, balance: running };
    });
    return withBalance.reverse(); // show newest first
  }, [customerBills, ledger, id]);

  const totalBilled = customerBills.reduce((s, b) => s + b.total, 0);
  const totalReceived = useMemo(() => ledger.filter(l => l.customerId === id && l.kind === 'payment').reduce((s, l) => s + l.credit, 0), [ledger, id]);
  const outstanding = customer?.pendingAmount ?? 0;
  const aging = customer ? customerAging(customer, initialBills) : null;
  const health = customer ? customerHealth(customer, aging) : null;

  const exportColumns: ExportColumn<DerivedRow>[] = [
    { header: 'Date', accessor: r => r.date },
    { header: 'Type', accessor: r => r.kind },
    { header: 'Description', accessor: r => r.description },
    { header: 'Debit (₹)', accessor: r => r.debit || '' },
    { header: 'Credit (₹)', accessor: r => r.credit || '' },
    { header: 'Balance (₹)', accessor: r => r.balance },
  ];

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/shop/customers')}>Back</Button>
        <Card>
          <p className="text-center text-gray-500 py-10">Customer not found.</p>
        </Card>
      </div>
    );
  }

  const handleAddPayment = () => {
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) {
      addToast('error', 'Enter a valid amount');
      return;
    }
    const entry: LedgerEntry = {
      id: 'L' + Date.now().toString(36),
      customerId: customer.id,
      date: new Date().toISOString().slice(0, 10),
      kind: 'payment',
      description: `Payment received (${paymentForm.method.toUpperCase()})${paymentForm.note ? ' — ' + paymentForm.note : ''}`,
      debit: 0,
      credit: amt,
    };
    setLedger(prev => [...prev, entry]);
    addToast('success', 'Payment recorded', `${formatCurrency(amt)} from ${customer.name}`);
    setPaymentForm({ amount: '', method: 'cash', note: '' });
    setPaymentOpen(false);
  };

  const handleAddAdjustment = () => {
    const amt = Number(adjustForm.amount);
    if (!amt || amt <= 0) {
      addToast('error', 'Enter a valid amount');
      return;
    }
    const entry: LedgerEntry = {
      id: 'L' + Date.now().toString(36),
      customerId: customer.id,
      date: new Date().toISOString().slice(0, 10),
      kind: 'adjustment',
      description: `Adjustment — ${adjustForm.note || (adjustForm.kind === 'credit' ? 'Discount / waiver' : 'Late fee / charge')}`,
      debit: adjustForm.kind === 'debit' ? amt : 0,
      credit: adjustForm.kind === 'credit' ? amt : 0,
    };
    setLedger(prev => [...prev, entry]);
    addToast('success', 'Adjustment posted');
    setAdjustForm({ amount: '', kind: 'credit', note: '' });
    setAdjustOpen(false);
  };

  const initial = customer.name.charAt(0).toUpperCase();
  const customerActivities = activityEntries.filter(a => a.refKind === 'customer' && a.refId === customer.id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/shop/customers')}>Back to customers</Button>

      {/* Header card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-2xl shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
              {health && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${HEALTH_TONES[health].bg} ${HEALTH_TONES[health].text}`}>
                  {HEALTH_TONES[health].emoji} {HEALTH_TONES[health].label}
                </span>
              )}
              {customer.tags?.map(t => (
                <span key={t} className="text-[11px] uppercase font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">{t}</span>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400">
                <Phone size={13} /> {customer.phone}
              </a>
              {customer.gstin && <span className="font-mono text-xs">GSTIN: {customer.gstin}</span>}
              {customer.area && <span>{customer.area}{customer.pincode ? ` · ${customer.pincode}` : ''}</span>}
            </div>
            {customer.address && <p className="text-xs text-gray-500 mt-1">{customer.address}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" icon={<MessageSquare size={16} />} onClick={() => {
              const text = encodeURIComponent(`Hi ${customer.name}, this is a friendly reminder of your pending balance of ${formatCurrency(outstanding)}. Thank you!`);
              window.open(`https://wa.me/91${customer.phone}?text=${text}`, '_blank');
            }}>WhatsApp</Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setPaymentOpen(true)}>Record payment</Button>
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Outstanding" value={formatCurrency(outstanding)} icon={<CircleDollarSign size={18} />} trend={aging ? `Oldest ${aging.oldestDays}d` : 'All cleared'} trendUp={!aging} />
        <StatCard title="Total Billed" value={formatCurrency(totalBilled)} icon={<ReceiptText size={18} />} />
        <StatCard title="Received" value={formatCurrency(totalReceived)} icon={<Wallet size={18} />} />
        <StatCard
          title="Credit Limit"
          value={customer.creditLimit ? formatCurrency(customer.creditLimit) : '—'}
          icon={<AlertTriangle size={18} />}
          trend={customer.creditLimit ? `${Math.round((outstanding / customer.creditLimit) * 100)}% used` : 'Not set'}
          trendUp={!customer.creditLimit || outstanding / customer.creditLimit < 0.8}
        />
      </div>

      {/* Aging detail */}
      {aging && (
        <Card>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Aging breakdown</h3>
              <p className="text-xs text-gray-500 mt-1">
                Oldest unpaid: <span className="font-medium">{aging.oldestDate ? formatDate(aging.oldestDate) : '—'}</span>
                {aging.oldestDate && <span className="text-gray-400"> · {formatRelativeTime(aging.oldestDate)}</span>}
              </p>
            </div>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${AGING_TONES[aging.bucket].bg} ${AGING_TONES[aging.bucket].text}`}>
              {AGING_TONES[aging.bucket].label}
            </span>
          </div>
        </Card>
      )}

      {/* Ledger entries */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Ledger (khata)</h3>
          <div className="flex items-center gap-2">
            <ExportMenu
              baseName={`ledger-${customer.name.replace(/\s+/g, '-').toLowerCase()}`}
              title={`${customer.name} — ledger`}
              meta={`${allEntries.length} entries · Outstanding ${formatCurrency(outstanding)}`}
              columns={exportColumns}
              rows={allEntries}
              size="sm"
            />
            <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => setAdjustOpen(true)}>Adjustment</Button>
          </div>
        </div>

        {allEntries.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {allEntries.map(e => (
              <li key={e.id} className="py-3 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                  e.kind === 'payment' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                  e.kind === 'adjustment' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                  e.kind === 'return' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                  'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
                  {e.kind === 'payment' ? <Wallet size={16} /> : e.kind === 'return' ? <ReceiptText size={16} /> : e.kind === 'adjustment' ? <Pencil size={16} /> : <ReceiptText size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(e.date)} · <span className="capitalize">{e.kind}</span></p>
                </div>
                <div className="text-right shrink-0">
                  {e.debit > 0 && <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">+{formatCurrency(e.debit)}</p>}
                  {e.credit > 0 && <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">−{formatCurrency(e.credit)}</p>}
                  <p className="text-[11px] text-gray-500 tabular-nums">Bal: {formatCurrency(e.balance)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Activity log */}
      {customerActivities.length > 0 && (
        <Card>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Activity</h3>
          <ul className="space-y-2">
            {customerActivities.map(a => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <Badge variant="info">{a.kind}</Badge>
                <span className="flex-1 text-gray-700 dark:text-gray-300">{a.message}</span>
                <span className="text-xs text-gray-500">{a.actor} · {formatRelativeTime(a.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Payment Modal */}
      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Record payment" size="sm">
        <div className="space-y-4">
          <Input label="Amount (₹) *" type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
          <Dropdown
            label="Method"
            options={PAYMENT_METHODS.map(m => ({ label: m.toUpperCase(), value: m }))}
            value={paymentForm.method}
            onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })}
          />
          <Input label="Note (optional)" value={paymentForm.note} onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })} placeholder="e.g. Partial settlement" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddPayment}>Record payment</Button>
          </div>
        </div>
      </Modal>

      {/* Adjustment modal */}
      <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)} title="Add adjustment" size="sm">
        <div className="space-y-4">
          <Dropdown
            label="Type"
            options={[
              { label: 'Credit (reduce balance)', value: 'credit' },
              { label: 'Debit (increase balance)', value: 'debit' },
            ]}
            value={adjustForm.kind}
            onChange={e => setAdjustForm({ ...adjustForm, kind: e.target.value as 'credit' | 'debit' })}
          />
          <Input label="Amount (₹) *" type="number" value={adjustForm.amount} onChange={e => setAdjustForm({ ...adjustForm, amount: e.target.value })} />
          <Input label="Reason / note" value={adjustForm.note} onChange={e => setAdjustForm({ ...adjustForm, note: e.target.value })} placeholder="e.g. Goodwill discount" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddAdjustment}>Post adjustment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
