import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IndianRupee, Receipt, Clock, AlertTriangle, ArrowRight, PackageX,
  Share2, CheckCircle2, Phone, Plus, ShoppingCart, Package, Users,
  TrendingUp, TrendingDown, BarChart3, Banknote, Smartphone, CreditCard as CardIcon,
  Activity, RefreshCw,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { StatCard, Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { bills, customers, inventoryItems, expenses } from '../../data/shop-dummy';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

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

const CLEARED_TODAY = [
  { id: 'ct-1', name: 'Sunil Sharma', phone: '9876543211', amount: 1500 },
  { id: 'ct-2', name: 'Ravi Tiwari', phone: '9876543217', amount: 800 },
];

export function ShopDashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [lowStockOpen, setLowStockOpen] = useState(false);
  const [udhaarOpen, setUdhaarOpen] = useState(false);
  const [clearedOpen, setClearedOpen] = useState(false);

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
            onClick={() => addToast('success', 'Data refreshed')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'New Bill', icon: ShoppingCart, color: 'bg-emerald-600', to: '/shop/billing' },
          { label: 'Add Item', icon: Package, color: 'bg-blue-600', to: '/shop/inventory' },
          { label: 'Add Customer', icon: Users, color: 'bg-purple-600', to: '/shop/customers' },
          { label: 'View Reports', icon: BarChart3, color: 'bg-amber-600', to: '/shop/reports' },
        ].map(({ label, icon: Icon, color, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-left hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all"
          >
            <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
              <Icon size={17} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 min-w-0">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(todaySales)}
          icon={<IndianRupee size={20} />}
          trend={`${salesTrend >= 0 ? '+' : ''}${salesTrend}% vs yesterday`}
          trendUp={salesTrend >= 0}
        />
        <StatCard
          title="Bills Today"
          value={String(billsToday)}
          icon={<Receipt size={20} />}
          trend={`${billsTrend >= 0 ? '+' : ''}${billsTrend}% vs yesterday`}
          trendUp={billsTrend >= 0}
        />
        <StatCard
          title="Pending Udhaar"
          value={formatCurrency(pendingUdhaar)}
          icon={<Clock size={20} />}
          trend={`${pendingCustomers.length} customer${pendingCustomers.length === 1 ? '' : 's'}`}
          trendUp={false}
          onClick={() => setUdhaarOpen(true)}
        />
        <StatCard
          title="Low Stock Items"
          value={String(lowStockItems.length)}
          icon={<AlertTriangle size={20} />}
          trend={outOfStockItems.length > 0 ? `${outOfStockItems.length} out of stock` : 'Needs reorder'}
          trendUp={lowStockItems.length === 0}
          onClick={() => setLowStockOpen(true)}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          onClick={() => setClearedOpen(true)}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Cleared Today</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(CLEARED_TODAY.reduce((s, c) => s + c.amount, 0))}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{CLEARED_TODAY.length} customers</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Weekly Revenue</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(weeklyRevenue)}</p>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <TrendingDown size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Today's Expenses</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(totalExpensesToday)}</p>
              <p className="text-xs text-gray-500">Tracked expenses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
            <p className="text-xs text-gray-500">Last 7 days sales</p>
          </div>
          <Link to="/shop/reports" className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
            Full report <ArrowRight size={14} />
          </Link>
        </div>
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
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 min-w-0">
          <Card className="overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Items by Revenue</h2>
            {topItems.length === 0 ? (
              <div className="flex h-[220px] flex-col items-center justify-center text-gray-400"><PackageX size={28} /><p className="mt-2 text-sm">No sales yet.</p></div>
            ) : (
              <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={gridColor} horizontal={false} />
                    <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fill: isDark ? '#d1d5db' : '#374151', fontSize: 11 }} tickLine={false} width={90} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <Card className="overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payments</h2>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(Number(v)), String(n)]} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Pie data={paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="42%" innerRadius={40} outerRadius={65} paddingAngle={3} stroke="none">
                  {paymentBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {paymentBreakdown.map(entry => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PAYMENT_COLORS[entry.name] }} />
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    {entry.name === 'Cash' ? <Banknote size={12} /> : entry.name === 'UPI' ? <Smartphone size={12} /> : <CardIcon size={12} />}
                    {entry.name}
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white tabular-nums">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Bills */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            </div>
            <Link to="/shop/bills" className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {recentBills.map(bill => (
              <li key={bill.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{bill.customerName}</p>
                  <p className="text-xs text-gray-500">{formatShortDate(bill.date)} · {bill.items.length} item{bill.items.length === 1 ? '' : 's'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(bill.total)}</p>
                  {bill.isUdhaar && !bill.paid ? <Badge variant="warning">Udhaar</Badge> : <Badge variant="success">Paid</Badge>}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Top Customers */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Customers</h2>
            </div>
            <Link to="/shop/customers" className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
              All customers <ArrowRight size={14} />
            </Link>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {topCustomers.map((c, idx) => (
              <li key={c.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {idx + 1}
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.billCount} bill{c.billCount === 1 ? '' : 's'}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCurrency(c.spent)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div
          onClick={() => setLowStockOpen(true)}
          className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5 cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Low Stock Alert</h2>
              <Badge variant="warning">{lowStockItems.length} items</Badge>
            </div>
            <Link to="/shop/inventory" onClick={e => e.stopPropagation()} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {lowStockItems.slice(0, 5).map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-500/20 rounded-lg p-2.5">
                <p className="text-xs text-gray-500 truncate">{item.category}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                <Badge variant={item.stock <= 3 ? 'danger' : 'warning'} className="mt-1">{item.stock} left</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Inventory Value */}
      <Card className="overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Value by Category</h2>
        <div className="h-[200px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(Number(v)), String(n)]} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Pie data={categorySplit} dataKey="value" nameKey="name" cx="50%" cy="42%" innerRadius={45} outerRadius={72} paddingAngle={2} stroke="none">
                {categorySplit.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Low Stock Modal */}
      <Modal open={lowStockOpen} onClose={() => setLowStockOpen(false)} title="Low Stock Items" size="lg">
        <div className="space-y-1">
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">All items are well stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {lowStockItems.map(item => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">{item.category}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.price)} per {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={item.stock <= 3 ? 'danger' : 'warning'}>{item.stock} left</Badge>
                    <Button variant="secondary" size="sm" icon={<Share2 size={14} />} onClick={() => shareOnWhatsApp(item)}>WhatsApp</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      {/* Pending Udhaar Modal */}
      <Modal open={udhaarOpen} onClose={() => setUdhaarOpen(false)} title="Pending Udhaar" size="lg">
        <div className="space-y-1">
          {pendingCustomers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No pending dues.</p>
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
      <Modal open={clearedOpen} onClose={() => setClearedOpen(false)} title="Cleared Payments Today" size="md">
        <div className="space-y-1">
          {CLEARED_TODAY.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No payments cleared today.</p>
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
