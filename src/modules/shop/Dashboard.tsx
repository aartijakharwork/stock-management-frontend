import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, Receipt, Clock, AlertTriangle, ArrowRight, PackageX, Share2, CheckCircle2, Phone } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { StatCard, Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { bills, customers, inventoryItems } from '../../data/shop-dummy';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const TODAY = '2026-04-25';

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function lastSevenDays(): string[] {
  const out: string[] = [];
  const base = new Date(TODAY);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4'];

const CLEARED_TODAY = [
  { id: 'ct-1', name: 'Sunil Sharma', phone: '9876543211', amount: 1500 },
  { id: 'ct-2', name: 'Ravi Tiwari', phone: '9876543217', amount: 800 },
];

export function ShopDashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { addToast } = useToast();
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
  const billsToday = useMemo(() => bills.filter(b => b.date === TODAY).length, []);
  const pendingUdhaar = useMemo(() => customers.reduce((s, c) => s + c.pendingAmount, 0), []);
  const pendingCustomers = useMemo(() => customers.filter(c => c.pendingAmount > 0), []);
  const lowStockItems = useMemo(() => inventoryItems.filter(i => i.stock <= 10).sort((a, b) => a.stock - b.stock), []);

  const revenueSeries = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const b of bills) byDate.set(b.date, (byDate.get(b.date) || 0) + b.total);
    return lastSevenDays().map(d => ({ date: d, label: formatShortDate(d), revenue: byDate.get(d) || 0 }));
  }, []);

  const topItems = useMemo(() => {
    const tally = new Map<string, { name: string; qty: number }>();
    for (const b of bills) for (const it of b.items) {
      const cur = tally.get(it.id) || { name: it.name, qty: 0 };
      cur.qty += it.quantity;
      tally.set(it.id, cur);
    }
    return Array.from(tally.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, []);

  const categorySplit = useMemo(() => {
    const tally = new Map<string, number>();
    for (const i of inventoryItems) tally.set(i.category, (tally.get(i.category) || 0) + i.price * i.stock);
    return Array.from(tally.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, []);

  const shareOnWhatsApp = (item: { name: string; stock: number; unit: string }) => {
    const text = encodeURIComponent(`Low stock alert: ${item.name} — only ${item.stock} ${item.unit}(s) left. Please reorder.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.shopName || 'Shop Dashboard'}</h1>
          <p className="mt-1 text-sm text-gray-500">Here's how your shop is doing today.</p>
        </div>
        <Badge variant="success">{formatShortDate(TODAY)}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Sales" value={formatCurrency(todaySales)} icon={<IndianRupee size={20} />} />
        <StatCard title="Bills Today" value={String(billsToday)} icon={<Receipt size={20} />} />
        <StatCard
          title="Pending Udhaar"
          value={formatCurrency(pendingUdhaar)}
          icon={<Clock size={20} />}
          trend={`${pendingCustomers.length} customers`}
          trendUp={false}
          onClick={() => setUdhaarOpen(true)}
        />
        <StatCard
          title="Low Stock Items"
          value={String(lowStockItems.length)}
          icon={<AlertTriangle size={20} />}
          trend={lowStockItems.length > 0 ? 'Needs reorder' : 'All good'}
          trendUp={lowStockItems.length === 0}
          onClick={() => setLowStockOpen(true)}
        />
      </div>

      <div
        onClick={() => setClearedOpen(true)}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Cleared Payments Today</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{CLEARED_TODAY.length} customers</p>
            </div>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
            {formatCurrency(CLEARED_TODAY.reduce((s, c) => s + c.amount, 0))}
          </span>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </div>
          <Link to="/shop/bills" className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
            See bills <ArrowRight size={14} />
          </Link>
        </div>
        <div className="h-[260px] w-full">
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
              <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} width={48} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#shopRevFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Items Sold</h2>
          {topItems.length === 0 ? (
            <div className="flex h-[240px] flex-col items-center justify-center text-gray-400"><PackageX size={28} /><p className="mt-2 text-sm">No sales yet.</p></div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={gridColor} horizontal={false} />
                  <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fill: isDark ? '#d1d5db' : '#374151', fontSize: 11 }} tickLine={false} width={120} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)} sold`, 'Quantity']} />
                  <Bar dataKey="qty" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Split</h2>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(Number(v)), String(n)]} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Pie data={categorySplit} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                  {categorySplit.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div
        onClick={() => setLowStockOpen(true)}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock — Reorder Soon</h2>
          <Link to="/shop/inventory" onClick={e => e.stopPropagation()} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {lowStockItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-400"><PackageX size={28} /><p className="text-sm">All items are well stocked.</p></div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {lowStockItems.slice(0, 5).map(item => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{item.category}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                </div>
                <Badge variant="warning">{item.stock} {item.unit}{item.stock === 1 ? '' : 's'} left</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

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
                    <Badge variant={item.stock <= 5 ? 'danger' : 'warning'}>{item.stock} left</Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Share2 size={14} />}
                      onClick={() => shareOnWhatsApp(item)}
                    >
                      WhatsApp
                    </Button>
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
                    <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{formatCurrency(c.pendingAmount)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Modal>

      {/* Cleared Payments Today Modal */}
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
