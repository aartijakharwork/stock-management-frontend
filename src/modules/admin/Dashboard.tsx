import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Store, CreditCard, IndianRupee, TrendingUp, ArrowRight, Activity } from 'lucide-react';
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
import { StatCard, Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { adminStats, recentActivity, revenueByMonth, planDistribution, shops } from '../../data/admin-dummy';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

const PIE_COLORS = ['#f59e0b', '#10b981', '#6366f1'];

export function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tooltipStyle = isDark
    ? { background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }
    : { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };

  const axisColor = isDark ? '#6b7280' : '#9ca3af';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const topShops = useMemo(() =>
    [...shops].filter(s => s.status === 'active').sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of all shops and platform performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Shops" value={String(adminStats.totalShops)} icon={<Store size={20} />} />
        <StatCard title="Active Subscriptions" value={String(adminStats.activeSubscriptions)} icon={<CreditCard size={20} />} />
        <StatCard title="Platform Revenue" value={formatCurrency(adminStats.totalRevenue)} icon={<IndianRupee size={20} />} />
        <StatCard title="New This Month" value={String(adminStats.newShopsThisMonth)} icon={<TrendingUp size={20} />} trend="+12% from last month" trendUp />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
            <p className="text-xs text-gray-500">Last 6 months platform revenue</p>
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRevFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(16,185,129,0.3)" />
                  <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} tickLine={false} />
              <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} tickLine={false} width={50} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#adminRevFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Shops by Revenue</h2>
            <Link to="/admin/shops" className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topShops} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} horizontal={false} />
                <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fill: isDark ? '#d1d5db' : '#374151', fontSize: 11 }} tickLine={false} width={130} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Distribution</h2>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${Number(v)} shops`, String(n)]} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Pie data={planDistribution} dataKey="count" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                  {planDistribution.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {recentActivity.slice(0, 6).map(item => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  item.type === 'alert' ? 'bg-amber-500' : item.type === 'subscription' ? 'bg-blue-500' : item.type === 'payment' ? 'bg-emerald-500' : 'bg-gray-400'
                }`} />
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.message}</p>
              </div>
              <Badge variant="neutral">{item.time}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
