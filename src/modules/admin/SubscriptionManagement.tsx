import { useState, useMemo } from 'react';
import { Check, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Dropdown } from '../../components/ui/Dropdown';
import { Modal } from '../../components/ui/Modal';
import { shops as initialShops, adminSubscriptionPlans } from '../../data/admin-dummy';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePagination } from '../../hooks/usePagination';
import type { Shop, PlanName } from '../../types';

export function SubscriptionManagement() {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [assignOpen, setAssignOpen] = useState<Shop | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanName>('Standard');
  const { addToast } = useToast();

  const totalRevenue = useMemo(() => {
    const planPrices: Record<PlanName, number> = { Basic: 299, Standard: 599, Pro: 999 };
    return shops.filter(s => s.status === 'active').reduce((sum, s) => sum + planPrices[s.plan], 0);
  }, [shops]);

  const pagination = usePagination({
    data: shops,
    pageSize: 5,
    sortFns: {
      shop: (a, b) => a.name.localeCompare(b.name),
    },
  });

  const handleAssign = () => {
    if (!assignOpen) return;
    setShops(prev => prev.map(s => s.id === assignOpen.id ? { ...s, plan: selectedPlan } : s));
    addToast('success', 'Plan updated', `${assignOpen.name} is now on ${selectedPlan} plan`);
    setAssignOpen(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
        <p className="mt-1 text-sm text-gray-500">Manage shop subscriptions and billing.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Monthly Revenue" value={formatCurrency(totalRevenue)} icon={<CreditCard size={18} />} />
        <StatCard title="Active Plans" value={String(shops.filter(s => s.status === 'active').length)} icon={<CreditCard size={18} />} />
        <StatCard title="Pro Users" value={String(shops.filter(s => s.plan === 'Pro').length)} icon={<CreditCard size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {adminSubscriptionPlans.map(plan => (
          <div key={plan.id} className={`bg-white dark:bg-gray-900 border rounded-xl p-5 ${plan.recommended ? 'border-emerald-300 dark:border-emerald-500/30 ring-1 ring-emerald-100 dark:ring-emerald-500/10' : 'border-gray-200 dark:border-gray-800'}`}>
            {plan.recommended && (
              <Badge variant="success">Recommended</Badge>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">{plan.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(plan.price)}</span>
              <span className="text-sm text-gray-500">/ {plan.period}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-500">
              {shops.filter(s => s.plan === plan.name).length} shops on this plan
            </p>
          </div>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Shop Subscriptions</h2>
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
              header: 'Current Plan',
              render: s => <Badge variant={s.plan === 'Pro' ? 'info' : s.plan === 'Standard' ? 'success' : 'neutral'}>{s.plan}</Badge>,
            },
            {
              key: 'status',
              header: 'Status',
              render: s => <Badge variant={s.status === 'active' ? 'success' : s.status === 'suspended' ? 'danger' : 'warning'}>{s.status}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: s => (
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setSelectedPlan(s.plan); setAssignOpen(s); }}>
                  Change plan
                </Button>
              ),
            },
          ]}
          data={pagination.pageData}
          keyExtractor={s => s.id}
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={pagination.setPage}
          sortState={pagination.sortState}
          onSort={pagination.toggleSort}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
        />
      </Card>

      <Modal open={!!assignOpen} onClose={() => setAssignOpen(null)} title="Change Plan" size="sm">
        {assignOpen && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Changing plan for <span className="font-medium text-gray-900 dark:text-white">{assignOpen.name}</span>
            </p>
            <Dropdown
              label="Select Plan"
              options={[
                { label: 'Basic — ₹299/mo', value: 'Basic' },
                { label: 'Standard — ₹599/mo', value: 'Standard' },
                { label: 'Pro — ₹999/mo', value: 'Pro' },
              ]}
              value={selectedPlan}
              onChange={e => setSelectedPlan(e.target.value as PlanName)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setAssignOpen(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleAssign}>Update plan</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
