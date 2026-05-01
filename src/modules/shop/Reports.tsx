import { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, IndianRupee, Clock, Users,
  Banknote, Smartphone, CreditCard as CardIcon, AlertTriangle,
  PieChart as PieChartIcon, FileText, BookOpen, Receipt as ReceiptIcon,
  Snowflake, Sun,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart,
} from 'recharts';
import { StatCard, Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Toggle } from '../../components/ui/Toggle';
import { Modal } from '../../components/ui/Modal';
import { JargonHint } from '../../components/ui/JargonHint';
import { ExportMenu } from '../../components/ui/ExportMenu';
import { bills, customers, inventoryItems, expenses } from '../../data/shop-dummy';
import { formatCurrency, formatDate, formatInvoiceNo } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';
import type { ExportColumn } from '../../utils/exporters';
import type { Bill } from '../../types';

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
  const [compareMode, setCompareMode] = useState(false);
  const [drillDown, setDrillDown] = useState<{ title: string; bills: Bill[] } | null>(null);
  const { theme } = useTheme();
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

  // P&L — COGS uses item cost prices when available
  const cogs = useMemo(() => {
    let s = 0;
    for (const b of filteredBills) {
      for (const it of b.items) {
        const inv = inventoryItems.find(i => i.id === it.id);
        const cost = inv?.costPrice ?? Math.round(it.price * 0.7); // fallback 70% if cost not set
        s += cost * it.quantity;
      }
    }
    return s;
  }, [filteredBills]);
  const grossProfit = totalRevenue - cogs;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netProfitWithCogs = grossProfit - totalExpenses;

  // Day book — daily cash flow
  const dayBook = useMemo(() => {
    const dayMap = new Map<string, { date: string; cashIn: number; cashOut: number; bills: number }>();
    for (const b of filteredBills.filter(b => b.paid)) {
      const d = b.date.slice(0, 10);
      const cur = dayMap.get(d) || { date: d, cashIn: 0, cashOut: 0, bills: 0 };
      cur.cashIn += b.total;
      cur.bills += 1;
      dayMap.set(d, cur);
    }
    for (const e of filteredExpenses) {
      const cur = dayMap.get(e.date) || { date: e.date, cashIn: 0, cashOut: 0, bills: 0 };
      cur.cashOut += e.amount;
      dayMap.set(e.date, cur);
    }
    return Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  }, [filteredBills, filteredExpenses]);

  // GST summary — output GST per month from bills (assuming 18% inclusive)
  const gstSummary = useMemo(() => {
    const byMonth = new Map<string, { month: string; revenue: number; gst: number; cgst: number; sgst: number; bills: number }>();
    for (const b of filteredBills) {
      const m = b.date.slice(0, 7);
      const cur = byMonth.get(m) || { month: m, revenue: 0, gst: 0, cgst: 0, sgst: 0, bills: 0 };
      const taxable = b.total / 1.18;
      const gst = b.total - taxable;
      cur.revenue += b.total;
      cur.gst += gst;
      cur.cgst += gst / 2;
      cur.sgst += gst / 2;
      cur.bills += 1;
      byMonth.set(m, cur);
    }
    return Array.from(byMonth.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredBills]);

  // Slow-moving inventory: items not sold in last 30/60/90 days
  const slowMoving = useMemo(() => {
    const lastSold = new Map<string, string>();
    for (const b of bills) {
      for (const it of b.items) {
        const prev = lastSold.get(it.id);
        if (!prev || b.date > prev) lastSold.set(it.id, b.date);
      }
    }
    const today = TODAY.getTime();
    const buckets: { days: number; items: typeof inventoryItems }[] = [
      { days: 30, items: [] },
      { days: 60, items: [] },
      { days: 90, items: [] },
    ];
    for (const item of inventoryItems) {
      const lastIso = lastSold.get(item.id);
      const lastTs = lastIso ? new Date(lastIso).getTime() : 0;
      const daysSince = lastTs ? Math.floor((today - lastTs) / 86_400_000) : 999;
      for (const b of buckets) if (daysSince > b.days) b.items.push(item);
    }
    return { buckets, lastSold };
  }, []);

  // Hourly heatmap — synthesize plausible hourly distribution
  const hourlyHeatmap = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const grid: { day: string; hour: number; bills: number }[] = [];
    for (const day of days) {
      for (let h = 8; h <= 21; h++) {
        // Simulate: peaks 11-13 and 17-19; weekend slightly lower
        let base = 0;
        if (h >= 11 && h <= 13) base = 6;
        else if (h >= 17 && h <= 19) base = 7;
        else if (h >= 9 && h <= 20) base = 3;
        const dayMul = day === 'Sun' ? 0.4 : day === 'Sat' ? 0.85 : 1;
        const noise = Math.floor(Math.random() * 3);
        grid.push({ day, hour: h, bills: Math.round(base * dayMul) + noise });
      }
    }
    return { days, hours: Array.from({ length: 14 }, (_, i) => 8 + i), grid };
  }, []);

  // Comparison with previous period
  const comparisonSeries = useMemo(() => {
    if (!compareMode || !startDate) return null;
    const range = TODAY.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime());
    const prevStart = new Date(startDate.getTime() - range);
    const prevBills = bills.filter(b => {
      const t = new Date(b.date).getTime();
      return t >= prevStart.getTime() && t < prevEnd.getTime();
    });
    const map = new Map<string, number>();
    for (const b of prevBills) {
      map.set(b.date, (map.get(b.date) ?? 0) + b.total);
    }
    const span = Math.min(days, 15);
    const out: { label: string; prev: number }[] = [];
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(prevEnd);
      d.setDate(prevEnd.getDate() - 1 - i);
      const iso = d.toISOString().slice(0, 10);
      out.push({ label: formatShortDate(iso), prev: map.get(iso) ?? 0 });
    }
    return { data: out, total: prevBills.reduce((s, b) => s + b.total, 0) };
  }, [compareMode, startDate, days]);

  const revenueSeriesWithCompare = useMemo(() => {
    if (!compareMode || !comparisonSeries) return revenueSeries;
    return revenueSeries.map((row, idx) => ({ ...row, prev: comparisonSeries.data[idx]?.prev ?? 0 }));
  }, [revenueSeries, comparisonSeries, compareMode]);

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label ?? '';

  const summaryRows = useMemo(() => [
    { metric: 'Period', value: periodLabel },
    { metric: 'Total Revenue', value: formatCurrency(totalRevenue) },
    { metric: 'Total Collected', value: formatCurrency(totalCollected) },
    { metric: 'Pending Dues', value: formatCurrency(totalPending) },
    { metric: 'Total Expenses', value: formatCurrency(totalExpenses) },
    { metric: 'Net Profit', value: formatCurrency(netProfit) },
    { metric: 'Total Bills', value: String(filteredBills.length) },
    { metric: 'Average Bill Value', value: formatCurrency(avgBillValue) },
    { metric: 'Active Customers', value: String(topCustomers.length) },
  ], [periodLabel, totalRevenue, totalCollected, totalPending, totalExpenses, netProfit, filteredBills.length, avgBillValue, topCustomers.length]);

  const exportRows = useMemo(() => {
    const lines: { section: string; label: string; value: string }[] = [];
    summaryRows.forEach(r => lines.push({ section: 'Summary', label: r.metric, value: r.value }));

    filteredBills.forEach(b => lines.push({
      section: 'Bills',
      label: `${formatInvoiceNo(b.id, b.date)} · ${formatDate(b.date)} · ${b.customerName}`,
      value: formatCurrency(b.total),
    }));

    paymentBreakdown.forEach(p => lines.push({
      section: 'Payment Methods',
      label: p.name,
      value: formatCurrency(p.value),
    }));

    topItems.forEach((it, idx) => lines.push({
      section: 'Top Selling Items',
      label: `#${idx + 1} ${it.name} · ${it.qty} units`,
      value: formatCurrency(it.revenue),
    }));

    topCustomers.forEach((c, idx) => lines.push({
      section: 'Top Customers',
      label: `#${idx + 1} ${c.name} · ${c.bills} bills`,
      value: formatCurrency(c.spent),
    }));

    expenseByCategory.forEach(e => lines.push({
      section: 'Expenses by Category',
      label: e.name,
      value: formatCurrency(e.value),
    }));

    categoryRevenue.forEach(c => lines.push({
      section: 'Revenue by Category',
      label: c.name,
      value: formatCurrency(c.value),
    }));

    return lines;
  }, [summaryRows, filteredBills, paymentBreakdown, topItems, topCustomers, expenseByCategory, categoryRevenue]);

  const exportColumns: ExportColumn<{ section: string; label: string; value: string }>[] = [
    { header: 'Section', accessor: r => r.section },
    { header: 'Item', accessor: r => r.label },
    { header: 'Value', accessor: r => r.value },
  ];

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
          <ExportMenu
            baseName={`report-${period}`}
            title={`Reports · ${periodLabel}`}
            meta={`Period: ${periodLabel} · ${filteredBills.length} bills`}
            columns={exportColumns}
            rows={exportRows}
            size="sm"
          />
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
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Revenue</h2>
            <p className="text-xs text-gray-500">{PERIOD_OPTIONS.find(o => o.value === period)?.label}{compareMode && comparisonSeries ? ` · vs prev ${formatCurrency(comparisonSeries.total)}` : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <Toggle checked={compareMode} onChange={setCompareMode} />
              Compare to previous period
            </label>
            <Badge variant="success">{formatCurrency(totalRevenue)} total</Badge>
          </div>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueSeriesWithCompare} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="reportRevFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(16,185,129,0.3)" />
                  <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} />
              <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} width={52} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string, name) => [formatCurrency(Number(v)), name === 'revenue' ? 'This period' : 'Previous']} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#reportRevFill)" dot={{ fill: '#10b981', r: 3 }} name="revenue" />
              {compareMode && (
                <Line type="monotone" dataKey="prev" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="prev" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Profit & Loss view */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <PieChartIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profit & Loss</h2>
            <JargonHint term="cogs" />
          </div>
          <span className="text-xs text-gray-500">{periodLabel}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
            <p className="text-[11px] uppercase font-semibold text-emerald-700 dark:text-emerald-400">Revenue</p>
            <p className="text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30">
            <p className="text-[11px] uppercase font-semibold text-orange-700 dark:text-orange-400">− COGS</p>
            <p className="text-base font-bold tabular-nums text-orange-700 dark:text-orange-400">{formatCurrency(cogs)}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
            <p className="text-[11px] uppercase font-semibold text-blue-700 dark:text-blue-400">= Gross Profit</p>
            <p className="text-base font-bold tabular-nums text-blue-700 dark:text-blue-400">{formatCurrency(grossProfit)}</p>
            <p className="text-[11px] text-blue-700/70 dark:text-blue-300/70">Margin {grossMargin.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
            <p className="text-[11px] uppercase font-semibold text-red-700 dark:text-red-400">− Expenses</p>
            <p className="text-base font-bold tabular-nums text-red-700 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className={`p-3 rounded-lg border ${netProfitWithCogs >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'}`}>
            <p className={`text-[11px] uppercase font-semibold ${netProfitWithCogs >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>= Net Profit</p>
            <p className={`text-base font-bold tabular-nums ${netProfitWithCogs >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{formatCurrency(netProfitWithCogs)}</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-3">
          COGS uses item cost prices when available (auto-fills to 70% of sell price for items missing cost data).
        </p>
      </Card>

      {/* Day Book / Cash Book */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Day Book / Cash Book</h2>
          </div>
          <span className="text-xs text-gray-500">Last 14 active days</span>
        </div>
        {dayBook.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-6">No transactions in this period.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase text-gray-500 text-left border-b border-gray-200 dark:border-gray-800">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 px-3 text-right">Bills</th>
                  <th className="py-2 px-3 text-right">Cash in</th>
                  <th className="py-2 px-3 text-right">Cash out</th>
                  <th className="py-2 pl-3 text-right">Net flow</th>
                </tr>
              </thead>
              <tbody>
                {dayBook.map(d => {
                  const net = d.cashIn - d.cashOut;
                  return (
                    <tr key={d.date} className="border-b border-gray-100 dark:border-gray-800/50">
                      <td className="py-2 pr-3 font-medium">{formatDate(d.date)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{d.bills}</td>
                      <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">+{formatCurrency(d.cashIn)}</td>
                      <td className="py-2 px-3 text-right text-red-600 dark:text-red-400 tabular-nums">{d.cashOut > 0 ? `−${formatCurrency(d.cashOut)}` : '—'}</td>
                      <td className={`py-2 pl-3 text-right font-semibold tabular-nums ${net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{net >= 0 ? '+' : ''}{formatCurrency(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* GST summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">GST summary</h2>
          </div>
          <span className="text-xs text-gray-500">Output GST · per month</span>
        </div>
        {gstSummary.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-6">No GST data for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase text-gray-500 text-left border-b border-gray-200 dark:border-gray-800">
                  <th className="py-2 pr-3">Month</th>
                  <th className="py-2 px-3 text-right">Bills</th>
                  <th className="py-2 px-3 text-right">Revenue (incl)</th>
                  <th className="py-2 px-3 text-right">CGST</th>
                  <th className="py-2 px-3 text-right">SGST</th>
                  <th className="py-2 pl-3 text-right">Output GST</th>
                </tr>
              </thead>
              <tbody>
                {gstSummary.map(m => (
                  <tr key={m.month} className="border-b border-gray-100 dark:border-gray-800/50">
                    <td className="py-2 pr-3 font-medium">{m.month}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{m.bills}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(m.revenue)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(m.cgst)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(m.sgst)}</td>
                    <td className="py-2 pl-3 text-right font-semibold tabular-nums text-amber-700 dark:text-amber-400">{formatCurrency(m.gst)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-3">
          Computed from total bill values at 18% inclusive GST. For accurate GSTR-1, use HSN-wise breakdown via your accountant.
        </p>
      </Card>

      {/* Slow-moving inventory */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Snowflake size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Slow-moving inventory</h2>
          </div>
          <span className="text-xs text-gray-500">No sales in 30/60/90 days</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {slowMoving.buckets.map(b => (
            <div key={b.days} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">No sales in {b.days}+ days</p>
                <Badge variant={b.days >= 90 ? 'danger' : b.days >= 60 ? 'warning' : 'info'}>{b.items.length}</Badge>
              </div>
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {b.items.slice(0, 8).map(it => {
                  const last = slowMoving.lastSold.get(it.id);
                  return (
                    <li key={it.id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-gray-700 dark:text-gray-300">{it.name}</span>
                      <span className="text-gray-400 ml-2 shrink-0">{last ? formatDate(last) : 'never'}</span>
                    </li>
                  );
                })}
                {b.items.length > 8 && <li className="text-[10px] text-gray-400">+{b.items.length - 8} more</li>}
                {b.items.length === 0 && <li className="text-[11px] text-emerald-600 dark:text-emerald-400">All items selling well.</li>}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Hourly heatmap */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sun size={18} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hourly sales heatmap</h2>
          </div>
          <span className="text-xs text-gray-500">Bills per hour · darker = busier</span>
        </div>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid" style={{ gridTemplateColumns: `64px repeat(${hourlyHeatmap.hours.length}, 1fr)` }}>
              <div />
              {hourlyHeatmap.hours.map(h => (
                <div key={h} className="text-[10px] text-gray-400 text-center py-1">{h}</div>
              ))}
              {hourlyHeatmap.days.map(day => (
                <FragmentRow key={day} day={day} hours={hourlyHeatmap.hours} grid={hourlyHeatmap.grid} />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500">
              <span>Less</span>
              {[0, 1, 3, 5, 8, 10].map(intensity => (
                <span key={intensity} className="w-4 h-4 rounded" style={{ backgroundColor: heatColor(intensity) }} />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Receipt history quick stats — anchor for future deep dive */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ReceiptIcon size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bill activity log</h2>
          </div>
          <span className="text-xs text-gray-500">Last 8 transactions</span>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {filteredBills.slice(0, 8).map((b: Bill) => (
            <li key={b.id} className="flex items-center gap-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ReceiptIcon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{formatInvoiceNo(b.id, b.date)} · {b.customerName}</p>
                <p className="text-xs text-gray-500">{formatDate(b.date)} · {b.items.length} item{b.items.length === 1 ? '' : 's'}{b.createdBy ? ` · by ${b.createdBy}` : ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(b.total)}</p>
                <Badge variant={b.paid ? 'success' : 'warning'}>{b.paid ? 'Paid' : 'Udhaar'}</Badge>
              </div>
            </li>
          ))}
        </ul>
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
          <span className="text-xs text-gray-500">Click a bar to see bills</span>
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
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} name="revenue" cursor="pointer" onClick={(data) => {
                  if (data?.name) {
                    const itemBills = filteredBills.filter(b => b.items.some(it => it.name === data.name));
                    setDrillDown({ title: `Bills containing "${data.name}"`, bills: itemBills });
                  }
                }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* spacer */}
      <div />

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
      {/* Drill-down modal */}
      <Modal open={!!drillDown} onClose={() => setDrillDown(null)} title={drillDown?.title || 'Bills'} size="lg">
        {drillDown && drillDown.bills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                  <th className="text-left py-2 font-medium">Invoice</th>
                  <th className="text-left py-2 font-medium">Date</th>
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-right py-2 font-medium">Total</th>
                  <th className="text-center py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {drillDown.bills.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 font-mono text-xs">{formatInvoiceNo(b.id, b.date)}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{formatDate(b.date)}</td>
                    <td className="py-2 text-gray-900 dark:text-white">{b.customerName}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(b.total)}</td>
                    <td className="py-2 text-center">
                      <Badge variant={b.paid ? 'success' : 'warning'}>{b.paid ? 'Paid' : 'Pending'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-3 text-right">{drillDown.bills.length} bill{drillDown.bills.length === 1 ? '' : 's'} · Total: {formatCurrency(drillDown.bills.reduce((s, b) => s + b.total, 0))}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-8 text-center">No bills found.</p>
        )}
      </Modal>
    </div>
  );
}

function heatColor(intensity: number) {
  // 0..10+ → light to dark green
  const cap = Math.min(intensity, 10);
  const alpha = 0.07 + (cap / 10) * 0.85;
  return `rgba(16, 185, 129, ${alpha.toFixed(2)})`;
}

interface FragmentRowProps {
  day: string;
  hours: number[];
  grid: { day: string; hour: number; bills: number }[];
}

function FragmentRow({ day, hours, grid }: FragmentRowProps) {
  return (
    <>
      <div className="text-[11px] font-medium text-gray-500 px-2 py-1 flex items-center">{day}</div>
      {hours.map(h => {
        const cell = grid.find(g => g.day === day && g.hour === h);
        const bills = cell?.bills ?? 0;
        return (
          <div
            key={`${day}-${h}`}
            className="m-0.5 rounded h-7 flex items-center justify-center text-[10px] font-medium text-gray-700 dark:text-gray-200"
            style={{ backgroundColor: heatColor(bills) }}
            title={`${day} ${h}:00 — ${bills} bills`}
          >
            {bills > 0 ? bills : ''}
          </div>
        );
      })}
    </>
  );
}
