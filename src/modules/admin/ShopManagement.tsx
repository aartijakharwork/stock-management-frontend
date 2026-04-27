import { useState, useMemo } from 'react';
import { Eye, Power, Trash2, Store } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Dropdown } from '../../components/ui/Dropdown';
import { Card, StatCard } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { shops as initialShops } from '../../data/admin-dummy';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePagination } from '../../hooks/usePagination';
import type { Shop, ShopStatus } from '../../types';

const statusVariant: Record<ShopStatus, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  inactive: 'warning',
  suspended: 'danger',
};

export function ShopManagement() {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selected, setSelected] = useState<Shop | null>(null);
  const { addToast } = useToast();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shops.filter(s => {
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.owner.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || s.status === statusFilter;
      const matchesPlan = !planFilter || s.plan === planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [shops, search, statusFilter, planFilter]);

  const pagination = usePagination({
    data: filtered,
    pageSize: 5,
    sortFns: {
      shop: (a, b) => a.name.localeCompare(b.name),
      revenue: (a, b) => a.revenue - b.revenue,
      created: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  });

  const activeCount = shops.filter(s => s.status === 'active').length;

  const toggleStatus = (shop: Shop) => {
    const newStatus: ShopStatus = shop.status === 'active' ? 'inactive' : 'active';
    setShops(prev => prev.map(s => s.id === shop.id ? { ...s, status: newStatus } : s));
    addToast('success', `Shop ${newStatus}`, `${shop.name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
  };

  const deleteShop = (shop: Shop) => {
    if (!confirm(`Delete ${shop.name}? This cannot be undone.`)) return;
    setShops(prev => prev.filter(s => s.id !== shop.id));
    addToast('success', 'Shop deleted', `${shop.name} has been removed.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop Management</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage all registered shops.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Shops" value={String(shops.length)} icon={<Store size={18} />} />
        <StatCard title="Active" value={String(activeCount)} icon={<Store size={18} />} trend={`${Math.round((activeCount / shops.length) * 100)}% of total`} trendUp />
        <StatCard title="Total Revenue" value={formatCurrency(shops.reduce((s, sh) => s + sh.revenue, 0))} icon={<Store size={18} />} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <SearchInput placeholder="Search by shop or owner name..." value={search} onSearch={setSearch} />
          </div>
          <div className="sm:w-44">
            <Dropdown
              options={[
                { label: 'All statuses', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Suspended', value: 'suspended' },
              ]}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="sm:w-40">
            <Dropdown
              options={[
                { label: 'All plans', value: '' },
                { label: 'Basic', value: 'Basic' },
                { label: 'Standard', value: 'Standard' },
                { label: 'Pro', value: 'Pro' },
              ]}
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="hidden sm:block">
        <Table
          columns={[
            {
              key: 'shop',
              header: 'Shop',
              sortable: true,
              render: s => (
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.owner}</p>
                </div>
              ),
            },
            {
              key: 'plan',
              header: 'Plan',
              render: s => <Badge variant={s.plan === 'Pro' ? 'info' : s.plan === 'Standard' ? 'success' : 'neutral'}>{s.plan}</Badge>,
            },
            {
              key: 'status',
              header: 'Status',
              render: s => <Badge variant={statusVariant[s.status]}>{s.status}</Badge>,
            },
            {
              key: 'revenue',
              header: 'Revenue',
              sortable: true,
              render: s => <span className="font-medium text-gray-900 dark:text-white tabular-nums">{formatCurrency(s.revenue)}</span>,
            },
            {
              key: 'staff',
              header: 'Staff',
              render: s => <span className="text-gray-600 dark:text-gray-400">{s.staffCount}</span>,
            },
            {
              key: 'created',
              header: 'Created',
              sortable: true,
              render: s => <span className="text-gray-500 text-xs">{formatDate(s.createdAt)}</span>,
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right w-52',
              render: s => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={e => { e.stopPropagation(); setSelected(s); }}>
                    View
                  </Button>
                  <Button variant="ghost" size="sm" icon={<Power size={14} />} onClick={e => { e.stopPropagation(); toggleStatus(s); }}>
                    {s.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={e => { e.stopPropagation(); deleteShop(s); }}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={pagination.pageData}
          keyExtractor={s => s.id}
          emptyMessage="No shops found"
          onRowClick={s => setSelected(s)}
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={pagination.setPage}
          sortState={pagination.sortState}
          onSort={pagination.toggleSort}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
        />
      </div>

      <div className="space-y-3 sm:hidden">
        {pagination.pageData.map(s => (
          <button key={s.id} type="button" onClick={() => setSelected(s)} className="block w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                <p className="text-xs text-gray-500">{s.owner}</p>
              </div>
              <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <Badge variant="neutral">{s.plan}</Badge>
              <span className="font-medium text-gray-900 dark:text-white tabular-nums">{formatCurrency(s.revenue)}</span>
            </div>
          </button>
        ))}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Shop Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Shop Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{selected.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Owner</p>
                <p className="font-medium text-gray-900 dark:text-white">{selected.owner}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selected.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selected.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Plan</p>
                <Badge variant={selected.plan === 'Pro' ? 'info' : selected.plan === 'Standard' ? 'success' : 'neutral'}>{selected.plan}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <Badge variant={statusVariant[selected.status]}>{selected.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(selected.revenue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Staff Count</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selected.staffCount}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Address</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{selected.address}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="sm" icon={<Power size={14} />} onClick={() => { toggleStatus(selected); setSelected(null); }}>
                {selected.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => { deleteShop(selected); setSelected(null); }}>
                Delete shop
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
