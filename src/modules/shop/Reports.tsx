import { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, IndianRupee, Clock, Users,
  Banknote, Smartphone, CreditCard as CardIcon, Download, AlertTriangle,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { StatCard, Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { bills, customers, inventoryItems, expenses } from '../../data/shop-dummy';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

type Period = '7d' | '30d' | 'all';

const TODAY = new Date('2026-04-25');

function getDateRange(period: Period): Date | null {
  if (period === 'all') return null;
  const d = new Date(TODAY);
  if (period === '7d') d.setDate(d.getDate() - 7);
  else if (period === '30d') d.setDate(d.getDate() - 30);
  return d;
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const base = new Date(TODAY);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
const PAYMENT_COLORS: Record<string, string> = { Cash: '#10b981', UPI: '#6366f1', Card: '#f59e0b' };

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

export function ShopReports() {
  const [period, setPeriod] = useState<Period>('7d');
  const { theme } = useTheme();
  const { addToast } = useToast();
  const isDark = theme === 'dark';

  const tooltipStyle = isDark
    ? { background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }
    : { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };

  const axisColor = isDark ? '#6b7280' : '#9ca3af';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const startDate = useMemo(() => getDateRange(period), [period]);

  const filteredBills = useMemo(() =>
    bills.filter(b => !startDate || new Date(b.date) >= startDate),
    [startDate]
  );

  const filteredExpenses = useMemo(() =>
    expenses.filter(e => !startDate || new Date(e.date) >= startDate),
    [startDate]
  );

  const totalRevenue = useMemo(() => filteredBills.reduce((s, b) => s + b.total, 0), [filteredBills]);
  const totalCollected = useMemo(() => filteredBills.filter(b => b.paid).reduce((s, b) => s + b.total, 0), [filteredBills]);
  const totalPending = useMemo(() => filteredBills.filter(b => !b.paid).reduce((s, b) => s + b.total, 0), [filteredBills]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((s, e) => s + e.amount, 0), [filteredExpenses]);
  const netProfit = totalCollected - totalExpenses;

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 15;
  const revenueSeries = useMemo(() => {
    const byDate = new Map<string, { revenue: number; count: number }>();
    for (const b of filteredBills) {
      const cur = byDate.get(b.date) || { revenue: 0, count: 0 };
      cur.revenue += b.total;
      cur.count += 1;
      byDate.set(b.date, cur);
    }
    return lastNDays(Math.min(days, 15)).map(d => ({
      label: formatShortDate(d),
      revenue: byDate.get(d)?.revenue || 0,
      bills: byDate.get(d)?.count || 0,
    }));
  }, [filteredBills, days]);

  const paymentBreakdown = useMemo(() => {
    const byMethod = { Cash: 0, UPI: 0, Card: 0 };
    for (const b of filteredBills.filter(b => b.paid)) {
      if (b.paymentMethod === 'cash') byMethod.Cash += b.total;
      else if (b.paymentMethod === 'upi') byMethod.UPI += b.total;
      else if (b.paymentMethod === 'card') byMethod.Card += b.total;
    }
    return Object.entries(byMethod).map(([name, value]) => ({ name, value })).filter(e => e.value > 0);
  }, [filteredBills]);

  const topItems = useMemo(() => {
    const tally = new Map<string, { name: string; qty: number; revenue: number; category: string }>();
    for (const b of filteredBills) {
      for (const it of b.items) {
        const cur = tally.get(it.id) || { name: it.name, qty: 0, revenue: 0, category: it.category };
        cur.qty += it.quantity;
        cur.revenue += it.price * it.quantity;
        tally.set(it.id, cur);
      }
    }
    return Array.from(tally.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [filteredBills]);

  const topCustomers = useMemo(() => {
    const tally = new Map<string, { name: string; spent: number; bills: number; phone: string }>();
    for (const b of filteredBills.filter(b => b.customerId)) {
      const customer = customers.find(c => c.id === b.customerId);
      const cur = tally.get(b.customerId!) || { name: b.customerName, spent: 0, bills: 0, phone: customer?.phone || '' };
      cur.spent += b.total;
      cur.bills += 1;
      tally.set(b.customerId!, cur);
    }
    return Array.from(tally.values()).sort((a, b) => b.spent - a.spent).slice(0, 5);
  }, [filteredBills]);

  const expenseByCategory = useMemo(() => {
    const tally = new Map<string, number>();
    for (const e of filteredExpenses) tally.set(e.category, (tally.get(e.category) || 0) + e.amount);
    return Array.from(tally.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const categoryRevenue = useMemo(() => {
    const tally = new Map<string, number>();
    for (const b of filteredBills) for (const it of b.items) {
      const inv = inventoryItems.find(i => i.id === it.id);
      const cat = inv?.category || it.category || 'Other';
      tally.set(cat, (tally.get(cat) || 0) + it.price * it.quantity);
    }
    return Array.from(tally.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filteredBills]);

  const avgBillValue = filteredBills.length > 0 ? Math.round(totalRevenue / filteredBills.length) : 0;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Sales insights and business performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  period === opt.value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => addToast('info', 'Export coming soon')}>
            Export
          </Button>
        </div>
      </div>

      {/* Net Profit hero banner */}
      <div className={`rounded-xl border p-5 sm:p-6 ${
        netProfit >= 0
          ? 'bg-gradient-to-br from-emerald-50 via-white to-white dark:from-emerald-500/10 dark:via-gray-900 dark:to-gray-900 border-emerald-200 dark:border-emerald-500/30'
          : 'bg-gradient-to-br from-red-50 via-white to-white dark:from-red-500/10 dark:via-gray-900 dark:to-gray-900 border-red-200 dark:border-red-500/30'
      }`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
              netProfit >= 0
                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
            }`}>
              {netProfit >= 0 ? <TrendingUp size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide ${
                netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
              }`}>Net Profit · {PERIOD_OPTIONS.find(o => o.value === period)?.label}</p>
              <p className={`mt-1 text-3xl sm:text-4xl font-bold tabular-nums ${
                netProfit >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'
              }`}>{formatCurrency(netProfit)}</p>
              <p className="mt-1 text-xs text-gray-500">
                {netProfit >= 0 ? 'Collected revenue minus expenses.' : 'Expenses exceed collected revenue — review costs.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm sm:justify-end">
            <div className="text-right">
              <p className="text-[11px] text-gray-500">Collected</p>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCurrency(totalCollected)}</p>
            </div>
            <span className="text-gray-300 dark:text-gray-700">−</span>
            <div className="text-right">
              <p className="text-[11px] text-gray-500">Expenses</p>
              <p className="font-semibold text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(totalExpenses)}</p>
            </div>
            <span className="text-gray-300 dark:text-gray-700">=</span>
            <div className="text-right">
              <p className="text-[11px] text-gray-500">Profit</p>
              <p className={`font-semibold tabular-nums ${netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI row — 4 money flows */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<IndianRupee size={18} />} trend={`${filteredBills.length} bills`} trendUp />
        <StatCard title="Collected" value={formatCurrency(totalCollected)} icon={<Banknote size={18} />} trend="Cash in hand" trendUp />
        <StatCard title="Pending Dues" value={formatCurrency(totalPending)} icon={<Clock size={18} />} trend="Udhaar balance" trendUp={false} />
        <StatCard title="Total Expenses" value={formatCurrency(totalExpenses)} icon={<TrendingDown size={18} />} trend={`${filteredExpenses.length} entries`} trendUp={false} />
      </div>

      {/* Secondary KPI strip — context metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <IndianRupee size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Total Bills</p>
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{filteredBills.length}</p>
            <p className="text-[11px] text-gray-500">in selected period</p>
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Avg Bill Value</p>
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(avgBillValue)}</p>
            <p className="text-[11px] text-gray-500">per transaction</p>
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Active Customers</p>
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{topCustomers.length}</p>
            <p className="text-[11px] text-gray-500">with purchases</p>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Revenue</h2>
            <p className="text-xs text-gray-500">{PERIOD_OPTIONS.find(o => o.value === period)?.label}</p>
          </div>
          <Badge variant="success">{formatCurrency(totalRevenue)} total</Badge>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="reportRevFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(16,185,129,0.3)" />
                  <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} />
              <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} width={52} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [name === 'revenue' ? formatCurrency(Number(v)) : v, name === 'revenue' ? 'Revenue' : 'Bills']} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#reportRevFill)" dot={{ fill: '#10b981', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
        {/* Payment Breakdown */}
        <Card className="overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h2>
          {paymentBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No payment data available</p>
          ) : (
            <>
              <div className="h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(Number(v)), String(n)]} />
                    <Pie data={paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} stroke="none">
                      {paymentBreakdown.map(entry => (
                        <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">Total</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(totalCollected)}</span>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                {paymentBreakdown.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[entry.name] }} />
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        {entry.name === 'Cash' ? <Banknote size={13} /> : entry.name === 'UPI' ? <Smartphone size={13} /> : <CardIcon size={13} />}
                        {entry.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(entry.value)}</span>
                      <span className="text-xs text-gray-400 ml-2">{Math.round((entry.value / totalCollected) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Category Revenue */}
        <Card className="overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Category</h2>
          {categoryRevenue.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data available</p>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(Number(v)), String(n)]} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Pie data={categoryRevenue} dataKey="value" nameKey="name" cx="50%" cy="42%" innerRadius={40} outerRadius={70} paddingAngle={2} stroke="none">
                    {categoryRevenue.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Top Items */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Selling Items</h2>
          <span className="text-xs text-gray-500">Hover bars for revenue · qty</span>
        </div>
        {topItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No sales data</p>
        ) : (
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} horizontal={false} />
                <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fill: isDark ? '#d1d5db' : '#374151', fontSize: 11 }} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, _name, item) => [
                    `${formatCurrency(Number(v))} · ${item?.payload?.qty ?? 0} units`,
                    'Revenue',
                  ]}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Top Customers + Expenses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
        {/* Top Customers */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Customers</h2>
          </div>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No customer data</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {topCustomers.map((c, idx) => (
                <li key={c.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="text-xs text-gray-400 w-5 shrink-0 text-center font-medium">#{idx + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.bills} bill{c.bills === 1 ? '' : 's'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCurrency(c.spent)}</p>
                    <p className="text-xs text-gray-400">avg {formatCurrency(Math.round(c.spent / c.bills))}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Expense Breakdown */}
        <Card className="overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses Breakdown</h2>
          {expenseByCategory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No expense data</p>
          ) : (
            <div className="space-y-3">
              {expenseByCategory.map((cat, idx) => {
                const pct = Math.round((cat.value / totalExpenses) * 100);
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{pct}%</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(cat.value)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Expenses</span>
                <span className="text-base font-bold text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
