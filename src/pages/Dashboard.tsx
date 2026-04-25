import { useNavigate } from 'react-router-dom';
import { IndianRupee, TrendingUp, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { StatCard, Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { bills, inventoryItems, customers } from '../data/dummy';
import { formatCurrency, formatDate } from '../utils/formatters';

const todaySales = bills.filter(b => b.date === '2026-04-25').reduce((sum, b) => sum + b.total, 0);
const totalSales = bills.reduce((sum, b) => sum + b.total, 0);
const pendingUdhaar = customers.reduce((sum, c) => sum + c.pendingAmount, 0);
const lowStockCount = inventoryItems.filter(i => i.stock < 5).length;

const recentBills = bills.slice(0, 5);
const lowStockItems = inventoryItems.filter(i => i.stock < 10).sort((a, b) => a.stock - b.stock).slice(0, 5);

const topCategories = inventoryItems.reduce<Record<string, number>>((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + item.stock;
  return acc;
}, {});
const sortedCategories = Object.entries(topCategories).sort(([, a], [, b]) => b - a).slice(0, 5);
const maxCategoryStock = sortedCategories[0]?.[1] || 1;

interface SectionHeaderProps {
  title: string;
  to: string;
}

function SectionHeader({ title, to }: SectionHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</h2>
      <button
        onClick={() => navigate(to)}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-400/10 transition-colors cursor-pointer"
      >
        View all <ArrowRight size={13} />
      </button>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();

  const quickStats = [
    { label: 'Bills Today', value: bills.filter(b => b.date === '2026-04-25').length, change: '+2', up: true, to: '/bills' },
    { label: 'Active Customers', value: customers.filter(c => c.pendingAmount > 0).length, change: '-1', up: false, to: '/customers' },
    { label: 'Total Items', value: inventoryItems.length, change: '+3', up: true, to: '/inventory' },
    { label: 'Paid Bills', value: bills.filter(b => b.paid).length, change: '+1', up: true, to: '/bills' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(todaySales)}
          icon={<IndianRupee size={22} />}
          trend="12% vs yesterday"
          trendUp
          iconBg="bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400"
          delay={0}
          onClick={() => navigate('/bills')}
        />
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalSales)}
          icon={<TrendingUp size={22} />}
          trend="8% this month"
          trendUp
          iconBg="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400"
          delay={80}
          onClick={() => navigate('/bills')}
        />
        <StatCard
          title="Pending Udhaar"
          value={formatCurrency(pendingUdhaar)}
          icon={<Clock size={22} />}
          trend="3 customers"
          trendUp={false}
          iconBg="bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
          delay={160}
          onClick={() => navigate('/customers')}
        />
        <StatCard
          title="Low Stock Items"
          value={String(lowStockCount)}
          icon={<AlertTriangle size={22} />}
          trend={lowStockCount > 0 ? 'Needs restock' : 'All good'}
          trendUp={lowStockCount === 0}
          iconBg="bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
          delay={240}
          onClick={() => navigate('/inventory')}
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Quick Stats */}
        <Card animate animationDelay={320}>
          <h2 className="mb-4 text-[14px] font-semibold text-[var(--text-primary)]">Quick Stats</h2>
          <div className="space-y-3">
            {quickStats.map(stat => (
              <div
                key={stat.label}
                onClick={() => navigate(stat.to)}
                className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-4 py-3 transition-colors hover:bg-[var(--hover-bg)] cursor-pointer group"
              >
                <span className="text-[13px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-[var(--text-primary)]">{stat.value}</span>
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${stat.up ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.change}
                  </span>
                  <ArrowRight size={14} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Categories */}
        <Card animate animationDelay={400}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Top Categories</h2>
            <button
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-400/10 transition-colors cursor-pointer"
            >
              Details <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-3">
            {sortedCategories.map(([cat, stock]) => (
              <div key={cat} onClick={() => navigate('/inventory')} className="cursor-pointer group">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[13px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{cat}</span>
                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">{stock} units</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-secondary)]">
                  <div
                    className="h-2 rounded-full bg-primary-400 transition-all duration-700 group-hover:bg-primary-500"
                    style={{ width: `${(stock / maxCategoryStock) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card animate animationDelay={480}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Recent Activity</h2>
            <button
              onClick={() => navigate('/bills')}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-400/10 transition-colors cursor-pointer"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-2">
            {recentBills.slice(0, 4).map(bill => (
              <div
                key={bill.id}
                onClick={() => navigate('/bills')}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white
                  ${bill.isUdhaar ? 'bg-amber-400' : 'bg-emerald-400'}`}>
                  {bill.customerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">{bill.customerName}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">{formatDate(bill.date)} · {bill.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{formatCurrency(bill.total)}</p>
                  {bill.isUdhaar
                    ? <Badge variant="warning">Udhaar</Badge>
                    : <Badge variant="success">Paid</Badge>
                  }
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="animate-fade-in-up" style={{ animationDelay: '560ms' }}>
          <SectionHeader title="Recent Bills" to="/bills" />
          <Table
            columns={[
              { key: 'id', header: 'Bill #', render: b => <span className="font-medium">{b.id}</span> },
              { key: 'date', header: 'Date', render: b => formatDate(b.date) },
              { key: 'customer', header: 'Customer', render: b => b.customerName },
              { key: 'total', header: 'Amount', render: b => <span className="font-semibold">{formatCurrency(b.total)}</span> },
              {
                key: 'status', header: 'Status', render: b =>
                  b.isUdhaar ? <Badge variant="warning">Udhaar</Badge> : <Badge variant="success">Paid</Badge>,
              },
            ]}
            data={recentBills}
            keyExtractor={b => b.id}
            onRowClick={() => navigate('/bills')}
          />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '640ms' }}>
          <SectionHeader title="Low Stock Alert" to="/inventory" />
          <Table
            columns={[
              { key: 'name', header: 'Item', render: i => <span className="font-medium">{i.name}</span> },
              { key: 'stock', header: 'Stock', render: i => (
                <Badge variant={i.stock < 5 ? 'danger' : 'warning'}>{i.stock} {i.unit}s</Badge>
              )},
              { key: 'price', header: 'Price', render: i => formatCurrency(i.price) },
            ]}
            data={lowStockItems}
            keyExtractor={i => i.id}
            onRowClick={() => navigate('/inventory')}
          />
        </div>
      </div>
    </div>
  );
}
