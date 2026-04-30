import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Receipt, Clock, AlertTriangle, ArrowRight, ArrowUpRight, ArrowDownRight, PackageX,
  Share2, CheckCircle2, Phone, ShoppingCart, Package, Users,
  TrendingUp, TrendingDown, BarChart3, Banknote, Smartphone, CreditCard as CardIcon,
  Activity, RefreshCw, Check, X as XIcon, Sparkles, ChevronRight, History, FileText, User,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { bills, customers, inventoryItems, expenses } from '../../data/shop-dummy';
import { formatCurrency, formatInvoiceNo, formatRelativeTime } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRecentlyViewed, type RecentKind } from '../../hooks/useRecentlyViewed';

const TODAY = '2026-04-25';
const YESTERDAY = '2026-04-24';

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

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4'];

const PAYMENT_COLORS: Record<string, string> = {
  Cash: '#10b981',
  UPI: '#6366f1',
  Card: '#f59e0b',
};

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
];
function avatarTone(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % AVATAR_TONES.length;
  return AVATAR_TONES[h];
}

const CLEARED_TODAY = [
  { id: 'ct-1', name: 'Sunil Sharma', phone: '9876543211', amount: 1500 },
  { id: 'ct-2', name: 'Ravi Tiwari', phone: '9876543217', amount: 800 },
];

const recentKindMeta: Record<RecentKind, { icon: typeof Receipt; tone: string; label: string }> = {
  bill:     { icon: FileText, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', label: 'Bill' },
  customer: { icon: User,     tone: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400', label: 'Customer' },
  item:     { icon: Package,  tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', label: 'Item' },
};

export function ShopDashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { items: recentItems, clear: clearRecent } = useRecentlyViewed();
  const isDark = theme === 'dark';

  const [lowStockOpen, setLowStockOpen] = useState(false);
  const [lowStockLoading, setLowStockLoading] = useState(false);
  const [udhaarOpen, setUdhaarOpen] = useState(false);
  const [udhaarLoading, setUdhaarLoading] = useState(false);
  const [clearedOpen, setClearedOpen] = useState(false);
  const [clearedLoading, setClearedLoading] = useState(false);

  const openLowStock = () => {
    setLowStockOpen(true);
    setLowStockLoading(true);
    setTimeout(() => setLowStockLoading(false), 700);
  };
  const openUdhaar = () => {
    setUdhaarOpen(true);
    setUdhaarLoading(true);
    setTimeout(() => setUdhaarLoading(false), 700);
  };
  const openCleared = () => {
    setClearedOpen(true);
    setClearedLoading(true);
    setTimeout(() => setClearedLoading(false), 700);
  };
  const [kpiLoading, setKpiLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [setupDismissed, setSetupDismissed] = useState<boolean>(() => localStorage.getItem('shopmanager.setup.dismissed') === 'true');

  const dismissSetup = () => {
    localStorage.setItem('shopmanager.setup.dismissed', 'true');
    setSetupDismissed(true);
  };

  useEffect(() => {
    const t1 = setTimeout(() => setKpiLoading(false), 800);
    const t2 = setTimeout(() => setRevenueLoading(false), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const refreshDashboard = () => {
    setKpiLoading(true);
    setRevenueLoading(true);
    addToast('success', 'Refreshing data');
    setTimeout(() => setKpiLoading(false), 800);
    setTimeout(() => setRevenueLoading(false), 1400);
  };
  const [lowStockSelected, setLowStockSelected] = useState<Set<string>>(new Set());
  const [lowStockCategoryFilter, setLowStockCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (!lowStockOpen) {
      setLowStockSelected(new Set());
      setLowStockCategoryFilter('all');
    }
  }, [lowStockOpen]);

  const tooltipStyle = isDark
    ? { background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }
    : { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };

  const axisColor = isDark ? '#6b7280' : '#9ca3af';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const todaySales = useMemo(() => bills.filter(b => b.date === TODAY).reduce((s, b) => s + b.total, 0), []);
  const yesterdaySales = useMemo(() => bills.filter(b => b.date === YESTERDAY).reduce((s, b) => s + b.total, 0), []);
  const salesTrend = yesterdaySales > 0 ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) : 0;

  const billsToday = useMemo(() => bills.filter(b => b.date === TODAY).length, []);
  const billsYesterday = useMemo(() => bills.filter(b => b.date === YESTERDAY).length, []);
  const billsTrend = billsYesterday > 0 ? Math.round(((billsToday - billsYesterday) / billsYesterday) * 100) : 0;

  const pendingUdhaar = useMemo(() => customers.reduce((s, c) => s + c.pendingAmount, 0), []);
  const pendingCustomers = useMemo(() => customers.filter(c => c.pendingAmount > 0), []);
  const lowStockItems = useMemo(() => inventoryItems.filter(i => i.stock <= 10).sort((a, b) => a.stock - b.stock), []);
  const outOfStockItems = useMemo(() => inventoryItems.filter(i => i.stock === 0), []);

  const totalExpensesToday = useMemo(() => expenses.filter(e => e.date === TODAY).reduce((s, e) => s + e.amount, 0), []);

  const revenueSeries = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const b of bills) byDate.set(b.date, (byDate.get(b.date) || 0) + b.total);
    return lastNDays(7).map(d => ({ date: d, label: formatShortDate(d), revenue: byDate.get(d) || 0 }));
  }, []);

  const topItems = useMemo(() => {
    const tally = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const b of bills) for (const it of b.items) {
      const cur = tally.get(it.id) || { name: it.name, qty: 0, revenue: 0 };
      cur.qty += it.quantity;
      cur.revenue += it.price * it.quantity;
      tally.set(it.id, cur);
    }
    return Array.from(tally.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, []);

  const categorySplit = useMemo(() => {
    const tally = new Map<string, number>();
    for (const i of inventoryItems) tally.set(i.category, (tally.get(i.category) || 0) + i.price * i.stock);
    return Array.from(tally.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, []);

  const paymentBreakdown = useMemo(() => {
    const byMethod = { Cash: 0, UPI: 0, Card: 0 };
    for (const b of bills.filter(b => b.paid)) {
      if (b.paymentMethod === 'cash') byMethod.Cash += b.total;
      else if (b.paymentMethod === 'upi') byMethod.UPI += b.total;
      else if (b.paymentMethod === 'card') byMethod.Card += b.total;
    }
    return Object.entries(byMethod).map(([name, value]) => ({ name, value })).filter(e => e.value > 0);
  }, []);

  const topCustomers = useMemo(() => {
    const tally = new Map<string, { name: string; spent: number; billCount: number }>();
    for (const b of bills.filter(b => b.customerId)) {
      const cur = tally.get(b.customerId!) || { name: b.customerName, spent: 0, billCount: 0 };
      cur.spent += b.total;
      cur.billCount += 1;
      tally.set(b.customerId!, cur);
    }
    return Array.from(tally.values()).sort((a, b) => b.spent - a.spent).slice(0, 4);
  }, []);

  const recentBills = useMemo(() => [...bills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5), []);

  const shareOnWhatsApp = (item: { name: string; stock: number; unit: string }) => {
    const text = encodeURIComponent(`Low stock alert: ${item.name} — only ${item.stock} ${item.unit}(s) left. Please reorder.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const lowStockCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of lowStockItems) counts.set(i.category, (counts.get(i.category) || 0) + 1);
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [lowStockItems]);

  const filteredLowStock = useMemo(
    () => lowStockCategoryFilter === 'all'
      ? lowStockItems
      : lowStockItems.filter(i => i.category === lowStockCategoryFilter),
    [lowStockItems, lowStockCategoryFilter]
  );

  const allFilteredSelected = filteredLowStock.length > 0 && filteredLowStock.every(i => lowStockSelected.has(i.id));

  const toggleSelectAll = () => {
    const next = new Set(lowStockSelected);
    if (allFilteredSelected) filteredLowStock.forEach(i => next.delete(i.id));
    else filteredLowStock.forEach(i => next.add(i.id));
    setLowStockSelected(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(lowStockSelected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setLowStockSelected(next);
  };

  const shareSelectedOnWhatsApp = () => {
    const selected = lowStockItems.filter(i => lowStockSelected.has(i.id));
    if (selected.length === 0) return;
    const lines = selected.map(i => `• ${i.name} — only ${i.stock} ${i.unit}(s) left`);
    const text = encodeURIComponent(`Low stock alert (${selected.length} item${selected.length === 1 ? '' : 's'}):\n${lines.join('\n')}\n\nPlease reorder soon.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const weeklyRevenue = revenueSeries.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.shopName || 'Shop Dashboard'}</h1>
          <p className="mt-0.5 text-sm text-gray-500">Here's how your shop is doing today · <span className="font-medium text-gray-700 dark:text-gray-300">{formatShortDate(TODAY)}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-xs">Live</Badge>
          <button
            onClick={refreshDashboard}
            disabled={kpiLoading || revenueLoading}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Refresh"
          >
            <RefreshCw size={15} className={kpiLoading || revenueLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Setup checklist — visible until dismissed */}
      {!setupDismissed && (() => {
        const steps = [
          { id: 'shop', label: 'Add shop logo & GST details',  done: false, to: '/shop/settings' },
          { id: 'item', label: 'Add your first 5 items',       done: inventoryItems.length >= 5, to: '/shop/inventory' },
          { id: 'cust', label: 'Add your first customer',      done: customers.length > 0, to: '/shop/customers' },
          { id: 'bill', label: 'Generate your first bill',     done: bills.length > 0, to: '/shop/billing' },
          { id: 'tax',  label: 'Configure GST & tax rates',    done: false, to: '/shop/settings' },
        ];
        const completed = steps.filter(s => s.done).length;
        const pct = Math.round((completed / steps.length) * 100);
        return (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-white to-white dark:from-emerald-500/10 dark:via-gray-900 dark:to-gray-900 p-5 sm:p-6 relative">
            <button
              onClick={dismissSetup}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/60"
              aria-label="Dismiss setup checklist"
            >
              <XIcon size={14} />
            </button>
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
              <div className="sm:max-w-[280px]">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <Sparkles size={12} /> Get started
                </div>
                <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Set up your shop</h2>
                <p className="mt-1 text-xs text-gray-500">{completed} of {steps.length} done · finish setup to unlock tax-ready bills</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-emerald-100 dark:bg-emerald-500/15 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <ul className="mt-4 sm:mt-0 sm:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {steps.map(step => (
                  <li key={step.id}>
                    <Link
                      to={step.to}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                        step.done
                          ? 'border-emerald-200 dark:border-emerald-500/30 bg-white/70 dark:bg-gray-900/40'
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-500/40'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        step.done
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {step.done && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className={`flex-1 text-sm ${step.done ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                        {step.label}
                      </span>
                      {!step.done && <ChevronRight size={14} className="text-gray-400" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })()}

      {/* Quick Actions — compact pill row */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'New Bill', icon: ShoppingCart, to: '/shop/billing', primary: true },
          { label: 'Add Item', icon: Package, to: '/shop/inventory' },
          { label: 'Add Customer', icon: Users, to: '/shop/customers' },
          { label: 'View Reports', icon: BarChart3, to: '/shop/reports' },
        ].map(({ label, icon: Icon, to, primary }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className={
              primary
                ? 'inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors'
                : 'inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors'
            }
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Recently viewed strip */}
      {recentItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <History size={14} className="text-gray-400" />
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-gray-500">Continue where you left off</h2>
            </div>
            <button
              onClick={clearRecent}
              className="text-[11px] font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {recentItems.map(it => {
              const meta = recentKindMeta[it.kind];
              const Icon = meta.icon;
              return (
                <Link
                  key={`${it.kind}-${it.id}`}
                  to={it.to}
                  className="shrink-0 flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:shadow-sm transition-all min-w-[200px] max-w-[280px] group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.tone}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{meta.label}</span>
                      <span className="text-[10px] text-gray-400">· {formatRelativeTime(it.viewedAt)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{it.label}</p>
                    {it.sublabel && <p className="text-[11px] text-gray-500 truncate">{it.sublabel}</p>}
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero KPI + Mini KPIs */}
      {kpiLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 min-w-0" aria-busy="true">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6">
            <Skeleton width={110} height={10} rounded="sm" />
            <Skeleton width="60%" height={36} rounded="md" className="mt-3" />
            <Skeleton width={180} height={12} rounded="sm" className="mt-3" />
            <Skeleton height={64} rounded="md" className="mt-4" />
          </div>
          {[0, 1].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton width={70} height={10} rounded="sm" />
                <Skeleton width={80} height={24} rounded="md" />
                <Skeleton width={120} height={10} rounded="sm" />
              </div>
              <Skeleton width={36} height={36} rounded="lg" />
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 min-w-0">
        {/* Hero — Today's Sales with sparkline */}
        <div className="lg:col-span-2 bg-gradient-to-br from-emerald-50 via-white to-white dark:from-emerald-500/10 dark:via-gray-900 dark:to-gray-900 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Today's Sales</p>
              <p className="mt-1 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(todaySales)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  salesTrend >= 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                }`}>
                  {salesTrend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {salesTrend >= 0 ? '+' : ''}{salesTrend}%
                </span>
                <span className="text-xs text-gray-500">vs yesterday ({formatCurrency(yesterdaySales)})</span>
              </div>
            </div>
            <Badge variant="success" className="text-[10px]">Today</Badge>
          </div>
          <div className="mt-4 -mx-2 h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(16,185,129,0.35)" />
                    <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                  labelFormatter={(_, items) => items?.[0]?.payload?.label || ''}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#heroSparkFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bills Today */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">Bills Today</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{billsToday}</p>
            <p className={`mt-1 text-xs font-medium ${billsTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {billsTrend >= 0 ? '+' : ''}{billsTrend}% vs yesterday
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Receipt size={18} />
          </div>
        </div>

        {/* Low Stock — alert tint when needs attention */}
        <button
          onClick={openLowStock}
          className={`text-left rounded-xl p-4 flex items-start justify-between gap-3 transition-colors ${
            lowStockItems.length > 0
              ? 'bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50'
              : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">Low Stock</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{lowStockItems.length}</p>
            <p className={`mt-1 text-xs font-medium ${lowStockItems.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {outOfStockItems.length > 0 ? `${outOfStockItems.length} out of stock` : lowStockItems.length > 0 ? 'Needs reorder' : 'All good'}
            </p>
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            lowStockItems.length > 0
              ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            <AlertTriangle size={18} />
          </div>
        </button>
      </div>
      )}

      {/* Secondary KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 min-w-0">
        {/* Pending Udhaar — alert tint when > 0 */}
        <button
          onClick={openUdhaar}
          className={`text-left rounded-xl p-4 flex items-center gap-3 transition-colors ${
            pendingUdhaar > 0
              ? 'bg-amber-50/60 dark:bg-amber-500/5 border border-amber-200/70 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/40'
              : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Pending Udhaar</p>
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(pendingUdhaar)}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">{pendingCustomers.length} customer{pendingCustomers.length === 1 ? '' : 's'}</p>
          </div>
        </button>

        {/* Cleared Today */}
        <button
          onClick={openCleared}
          className="text-left rounded-xl p-4 flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Cleared Today</p>
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(CLEARED_TODAY.reduce((s, c) => s + c.amount, 0))}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{CLEARED_TODAY.length} customers</p>
          </div>
        </button>

        {/* Weekly Revenue */}
        <div className="rounded-xl p-4 flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Weekly Revenue</p>
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(weeklyRevenue)}</p>
            <p className="text-[11px] text-gray-500">Last 7 days</p>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="rounded-xl p-4 flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <TrendingDown size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Today's Expenses</p>
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(totalExpensesToday)}</p>
            <p className="text-[11px] text-gray-500">Tracked</p>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
              <p className="text-xs text-gray-500">Last 7 days sales</p>
            </div>
            {revenueLoading && <Spinner size="sm" tone="primary" />}
          </div>
          <Link to="/shop/reports" className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
            Full report <ArrowRight size={14} />
          </Link>
        </div>
        {revenueLoading ? (
          <div className="h-[240px] w-full flex flex-col gap-2 justify-end" aria-busy="true">
            <div className="flex items-end justify-between gap-2 h-full pt-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                  key={i}
                  rounded="md"
                  className="flex-1"
                  height={`${30 + ((i * 17) % 60)}%`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} width={28} height={9} rounded="sm" />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="shopRevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(16,185,129,0.3)" />
                    <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} />
                <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} width={52} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#shopRevFill)" dot={{ fill: '#10b981', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Items — modern inline-bar list */}
        <div className="lg:col-span-2 min-w-0">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top items by revenue</h2>
                <p className="text-[11px] text-gray-500">Best sellers · last 7 days</p>
              </div>
              <Link to="/shop/inventory" className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
                Inventory <ArrowRight size={12} />
              </Link>
            </div>
            {topItems.length === 0 ? (
              <EmptyState icon={<PackageX size={26} />} title="No sales yet" description="Generate a few bills to see top sellers." compact />
            ) : (
              <ul className="space-y-3">
                {topItems.map((item, idx) => {
                  const max = topItems[0].revenue || 1;
                  const pct = (item.revenue / max) * 100;
                  return (
                    <li key={item.name} className="group">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-[10px] font-bold tabular-nums shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 tabular-nums shrink-0">
                            {item.qty} sold
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 group-hover:from-emerald-600 group-hover:to-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Payments — donut with center total + per-row bars */}
        {(() => {
          const totalPay = paymentBreakdown.reduce((s, e) => s + e.value, 0);
          return (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Payments</h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">7 days</span>
              </div>
              <div className="relative h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(Number(v)), String(n)]} />
                    <Pie data={paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} stroke="none">
                      {paymentBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">Collected</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(totalPay)}</span>
                </div>
              </div>
              <div className="mt-3 space-y-2.5">
                {paymentBreakdown.map(entry => {
                  const pct = totalPay > 0 ? (entry.value / totalPay) * 100 : 0;
                  return (
                    <div key={entry.name}>
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          {entry.name === 'Cash' ? <Banknote size={12} /> : entry.name === 'UPI' ? <Smartphone size={12} /> : <CardIcon size={12} />}
                          <span>{entry.name}</span>
                          <span className="text-gray-400 tabular-nums">{Math.round(pct)}%</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(entry.value)}</span>
                      </div>
                      <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: PAYMENT_COLORS[entry.name] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent transactions</h2>
            </div>
            <Link to="/shop/bills" className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <ul className="space-y-1 -mx-2">
            {recentBills.map(bill => {
              const isUd = bill.isUdhaar && !bill.paid;
              const tone = avatarTone(bill.customerName);
              return (
                <li key={bill.id}>
                  <Link
                    to="/shop/bills"
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${tone}`}>
                      {bill.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{bill.customerName}</p>
                      <p className="text-[11px] text-gray-500 truncate">
                        <span className="font-mono">{formatInvoiceNo(bill.id, bill.date)}</span>
                        <span className="mx-1.5 text-gray-300 dark:text-gray-700">·</span>
                        {bill.items.length} item{bill.items.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold tabular-nums ${isUd ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(bill.total)}
                      </p>
                      <p className="text-[10px] text-gray-400">{formatRelativeTime(bill.date)}</p>
                    </div>
                    <span className="shrink-0 hidden sm:inline-block">
                      {isUd ? <Badge variant="warning">Udhaar</Badge> : <Badge variant="success">Paid</Badge>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Top Customers — with proportional spend bars */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-purple-600 dark:text-purple-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top customers</h2>
            </div>
            <Link to="/shop/customers" className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
              All customers <ArrowRight size={12} />
            </Link>
          </div>
          {topCustomers.length === 0 ? (
            <EmptyState icon={<Users size={26} />} title="No customer activity" description="Top spenders will appear here." compact />
          ) : (
            <ul className="space-y-3">
              {topCustomers.map((c, idx) => {
                const max = topCustomers[0]?.spent || 1;
                const pct = (c.spent / max) * 100;
                const tone = avatarTone(c.name);
                return (
                  <li key={c.name} className="group">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-[10px] font-bold tabular-nums shrink-0">
                        {idx + 1}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${tone}`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                        <p className="text-[11px] text-gray-500">{c.billCount} bill{c.billCount === 1 ? '' : 's'}</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                        {formatCurrency(c.spent)}
                      </span>
                    </div>
                    <div className="ml-[52px] h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-700 group-hover:from-purple-500 group-hover:to-purple-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div
          onClick={openLowStock}
          className="bg-amber-50/70 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5 cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Low stock alert</h2>
                <p className="text-[11px] text-gray-500">{lowStockItems.length} items below reorder level · tap to manage</p>
              </div>
            </div>
            <Link
              to="/shop/inventory"
              onClick={e => e.stopPropagation()}
              className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline shrink-0"
            >
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {lowStockItems.slice(0, 5).map(item => {
              const REORDER = 10;
              const stockPct = Math.min(100, (item.stock / REORDER) * 100);
              const isCritical = item.stock <= 3;
              return (
                <div key={item.id} className="bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 group">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider truncate">{item.category}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate mt-0.5">{item.name}</p>
                  <div className="mt-2.5">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className={`text-base font-bold tabular-nums leading-none ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {item.stock}
                      </span>
                      <span className="text-[10px] text-gray-400 tabular-nums">/ {REORDER} min</span>
                    </div>
                    <div className="h-1 rounded-full bg-amber-100 dark:bg-amber-500/15 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Inventory Value */}
      {(() => {
        const totalStockValue = categorySplit.reduce((s, e) => s + e.value, 0);
        return (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Inventory value by category</h2>
                <p className="text-[11px] text-gray-500">{formatCurrency(totalStockValue)} total stock value · {categorySplit.length} categor{categorySplit.length === 1 ? 'y' : 'ies'}</p>
              </div>
              <Link to="/shop/inventory" className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
                Inventory <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-center min-w-0">
              <div className="relative h-[200px] mx-auto md:mx-0 w-full max-w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(Number(v)), String(n)]} />
                    <Pie data={categorySplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                      {categorySplit.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">Total</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(totalStockValue)}</span>
                </div>
              </div>
              <ul className="space-y-2.5 min-w-0">
                {categorySplit.map((cat, idx) => {
                  const pct = totalStockValue > 0 ? (cat.value / totalStockValue) * 100 : 0;
                  const color = PIE_COLORS[idx % PIE_COLORS.length];
                  return (
                    <li key={cat.name}>
                      <div className="flex items-center justify-between text-[12px] mb-1 gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-gray-700 dark:text-gray-300 truncate">{cat.name}</span>
                          <span className="text-gray-400 tabular-nums shrink-0">{Math.round(pct)}%</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white tabular-nums shrink-0">{formatCurrency(cat.value)}</span>
                      </div>
                      <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>
        );
      })()}

      {/* Low Stock Modal */}
      <Modal
        open={lowStockOpen}
        onClose={() => setLowStockOpen(false)}
        title="Low Stock Items"
        size="lg"
        loading={lowStockLoading}
        loadingLabel="Loading low stock items…"
      >
        {lowStockItems.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={28} />}
            title="All items are well stocked"
            description="No reorders needed. We'll alert you when stock dips below the reorder level."
            tone="success"
          />
        ) : (
          <div className="flex flex-col -m-5">
            {/* Category filter chips */}
            <div className="px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLowStockCategoryFilter('all')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    lowStockCategoryFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All <span className="opacity-70">{lowStockItems.length}</span>
                </button>
                {lowStockCategories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setLowStockCategoryFilter(cat.name)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      lowStockCategoryFilter === cat.name
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat.name} <span className="opacity-70">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Select-all bar */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    allFilteredSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500'
                  }`}
                >
                  {allFilteredSelected && <Check size={11} strokeWidth={3} />}
                </span>
                <input type="checkbox" className="sr-only" checked={allFilteredSelected} onChange={toggleSelectAll} />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {lowStockSelected.size > 0
                    ? <><span className="font-semibold text-gray-900 dark:text-white">{lowStockSelected.size}</span> selected</>
                    : <>Select all{lowStockCategoryFilter !== 'all' ? ` in ${lowStockCategoryFilter}` : ''}</>
                  }
                </span>
              </label>
              {lowStockSelected.size > 0 && (
                <button
                  onClick={() => setLowStockSelected(new Set())}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <XIcon size={12} /> Clear
                </button>
              )}
            </div>

            {/* Item list */}
            <ul className="px-5 max-h-[50vh] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800">
              {filteredLowStock.length === 0 ? (
                <li className="py-8 text-sm text-gray-500 text-center">No items in this category.</li>
              ) : filteredLowStock.map(item => {
                const isSelected = lowStockSelected.has(item.id);
                return (
                  <li
                    key={item.id}
                    onClick={() => toggleSelectOne(item.id)}
                    className={`flex items-center gap-3 py-3 cursor-pointer rounded-lg px-2 -mx-2 transition-colors ${
                      isSelected ? 'bg-emerald-50/60 dark:bg-emerald-500/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">{item.category}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} per {item.unit}</p>
                    </div>
                    <Badge variant={item.stock <= 3 ? 'danger' : 'warning'}>{item.stock} left</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Share2 size={13} />}
                      onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(item); }}
                    >
                      Share
                    </Button>
                  </li>
                );
              })}
            </ul>

            {/* Sticky bulk action bar */}
            {lowStockSelected.size > 0 && (
              <div className="sticky bottom-0 px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{lowStockSelected.size}</span> item{lowStockSelected.size === 1 ? '' : 's'} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setLowStockSelected(new Set())}>Cancel</Button>
                  <Button variant="primary" size="sm" icon={<Share2 size={14} />} onClick={shareSelectedOnWhatsApp}>
                    WhatsApp {lowStockSelected.size} item{lowStockSelected.size === 1 ? '' : 's'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Pending Udhaar Modal */}
      <Modal
        open={udhaarOpen}
        onClose={() => setUdhaarOpen(false)}
        title="Pending Udhaar"
        size="lg"
        loading={udhaarLoading}
        loadingLabel="Loading udhaar customers…"
      >
        <div className="space-y-1">
          {pendingCustomers.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={28} />}
              title="No pending dues"
              description="All customers are settled. Nice work!"
              tone="success"
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                <span className="text-sm text-gray-500">{pendingCustomers.length} customers</span>
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{formatCurrency(pendingUdhaar)} total</span>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {pendingCustomers.map(c => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} /> {c.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{formatCurrency(c.pendingAmount)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Share2 size={13} />}
                        onClick={() => {
                          const text = encodeURIComponent(`Hi ${c.name}, you have a pending payment of ${formatCurrency(c.pendingAmount)} at our shop. Please clear at your earliest convenience.`);
                          window.open(`https://wa.me/91${c.phone}?text=${text}`, '_blank');
                        }}
                      >
                        Remind
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Modal>

      {/* Cleared Payments Modal */}
      <Modal
        open={clearedOpen}
        onClose={() => setClearedOpen(false)}
        title="Cleared Payments Today"
        size="md"
        loading={clearedLoading}
        loadingLabel="Loading payments…"
      >
        <div className="space-y-1">
          {CLEARED_TODAY.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={28} />}
              title="No payments cleared today"
              description="When customers settle their udhaar, they'll show up here."
              tone="neutral"
              compact
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                <span className="text-sm text-gray-500">{CLEARED_TODAY.length} customers</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(CLEARED_TODAY.reduce((s, c) => s + c.amount, 0))} received</span>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {CLEARED_TODAY.map(c => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} /> {c.phone}</p>
                      </div>
                    </div>
                    <Badge variant="success">{formatCurrency(c.amount)}</Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
