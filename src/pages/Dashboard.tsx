import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  Receipt,
  Clock,
  AlertTriangle,
  ArrowRight,
  PackageX,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard, Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { bills, customers, inventoryItems } from '../data/dummy';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const TODAY = '2026-04-25';
const SHOP_NAME = 'Kumar Auto';

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

export function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartTheme = {
    axis: isDark ? '#9ca3af' : '#6b7280',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    tooltip: isDark
      ? {
          background: '#0b0b0d',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '12px',
        }
      : {
          background: '#ffffff',
          border: '1px solid rgb(229 231 235)',
          borderRadius: '8px',
          color: '#111827',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
    tooltipLabel: isDark ? '#fff' : '#111827',
    tooltipItem: isDark ? '#d1d5db' : '#374151',
    cyan: '#06b6d4',
    purple: '#a855f7',
    emerald: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
  };
  const pieColors = [
    chartTheme.cyan,
    chartTheme.purple,
    chartTheme.emerald,
    chartTheme.amber,
    chartTheme.red,
  ];

  const todaySales = useMemo(
    () => bills.filter(b => b.date === TODAY).reduce((s, b) => s + b.total, 0),
    []
  );
  const billsToday = useMemo(() => bills.filter(b => b.date === TODAY).length, []);
  const pendingUdhaar = useMemo(
    () => customers.reduce((s, c) => s + c.pendingAmount, 0),
    []
  );
  const lowStockItems = useMemo(
    () => inventoryItems.filter(i => i.stock <= 10).sort((a, b) => a.stock - b.stock),
    []
  );
  const lowStockCount = lowStockItems.length;

  const revenueSeries = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const b of bills) {
      byDate.set(b.date, (byDate.get(b.date) || 0) + b.total);
    }
    return lastSevenDays().map(d => ({
      date: d,
      label: formatShortDate(d),
      revenue: byDate.get(d) || 0,
    }));
  }, []);

  const topItems = useMemo(() => {
    const tally = new Map<string, { name: string; qty: number }>();
    for (const b of bills) {
      for (const it of b.items) {
        const cur = tally.get(it.id) || { name: it.name, qty: 0 };
        cur.qty += it.quantity;
        tally.set(it.id, cur);
      }
    }
    return Array.from(tally.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, []);

  const categorySplit = useMemo(() => {
    const tally = new Map<string, number>();
    for (const i of inventoryItems) {
      tally.set(i.category, (tally.get(i.category) || 0) + i.price * i.stock);
    }
    return Array.from(tally.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, []);

  const lastUpdated = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Greeting strip */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Today</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{SHOP_NAME}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Here is how your shop is doing today.</p>
        </div>
        <p className="text-xs text-gray-500">Last updated {lastUpdated}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(todaySales)}
          icon={<IndianRupee size={20} />}
          delay={1}
        />
        <StatCard
          title="Bills Today"
          value={String(billsToday)}
          icon={<Receipt size={20} />}
          delay={2}
        />
        <StatCard
          title="Pending Udhaar"
          value={formatCurrency(pendingUdhaar)}
          icon={<Clock size={20} />}
          trend={`${customers.filter(c => c.pendingAmount > 0).length} customers`}
          trendUp={false}
          delay={3}
        />
        <StatCard
          title="Low Stock Items"
          value={String(lowStockCount)}
          icon={<AlertTriangle size={20} />}
          trend={lowStockCount > 0 ? 'Needs reorder' : 'All good'}
          trendUp={lowStockCount === 0}
          delay={4}
        />
      </div>

      {/* Revenue trend */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Last 7 days</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
          </div>
          <Link
            to="/bills"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors"
          >
            See bills <ArrowRight size={13} />
          </Link>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.4)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis
                dataKey="label"
                stroke={chartTheme.axis}
                tick={{ fill: chartTheme.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: chartTheme.grid }}
              />
              <YAxis
                stroke={chartTheme.axis}
                tick={{ fill: chartTheme.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: chartTheme.grid }}
                width={48}
              />
              <Tooltip
                contentStyle={chartTheme.tooltip}
                labelStyle={{ color: chartTheme.tooltipLabel }}
                itemStyle={{ color: chartTheme.tooltipItem }}
                formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                cursor={{ stroke: 'rgba(34,211,238,0.3)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={chartTheme.cyan}
                strokeWidth={2}
                fill="url(#revFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two-up row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Best sellers</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Top Items Sold</h2>
          </div>
          {topItems.length === 0 ? (
            <div className="flex h-[240px] flex-col items-center justify-center text-gray-500">
              <PackageX size={28} />
              <p className="mt-2 text-sm">No sales yet.</p>
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topItems}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke={chartTheme.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke={chartTheme.axis}
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: chartTheme.grid }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={chartTheme.axis}
                    tick={{ fill: chartTheme.tooltipItem, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: chartTheme.grid }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={chartTheme.tooltip}
                    labelStyle={{ color: chartTheme.tooltipLabel }}
                    itemStyle={{ color: chartTheme.tooltipItem }}
                    cursor={{ fill: 'rgba(34,211,238,0.08)' }}
                    formatter={(v) => [`${Number(v)} sold`, 'Quantity']}
                  />
                  <Bar dataKey="qty" fill={chartTheme.cyan} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Stock value</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Category Split</h2>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={chartTheme.tooltip}
                  labelStyle={{ color: chartTheme.tooltipLabel }}
                  itemStyle={{ color: chartTheme.tooltipItem }}
                  formatter={(v, n) => [formatCurrency(Number(v)), String(n)]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: chartTheme.tooltipItem }}
                />
                <Pie
                  data={categorySplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                >
                  {categorySplit.map((_, idx) => (
                    <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Low stock alert list */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Action needed</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Low Stock — Reorder Soon</h2>
          </div>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {lowStockItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-500">
            <PackageX size={28} />
            <p className="text-sm">All items are well stocked.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-white/5">
            {lowStockItems.slice(0, 5).map(item => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">
                    {item.category}
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                </div>
                <Badge variant="warning">
                  {item.stock} {item.unit}
                  {item.stock === 1 ? '' : 's'} left
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
