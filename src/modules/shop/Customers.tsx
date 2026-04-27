import { useState, useMemo } from 'react';
import { Plus, Phone, Eye, CircleDollarSign, Users, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { Card, StatCard } from '../../components/ui/Card';
import { customers as initialCustomers, bills as initialBills } from '../../data/shop-dummy';
import { formatCurrency, formatDate, generateId } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { usePagination } from '../../hooks/usePagination';
import type { Customer } from '../../types';

type DuesFilter = '' | 'with' | 'cleared';

export function ShopCustomers() {
  const [customersList, setCustomers] = useState(initialCustomers);
  const [bills, setBills] = useState(initialBills);
  const [search, setSearch] = useState('');
  const [duesFilter, setDuesFilter] = useState<DuesFilter>('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [formError, setFormError] = useState<{ name?: string; phone?: string }>({});
  const [selected, setSelected] = useState<Customer | null>(null);
  const { addToast } = useToast();
  const { can } = usePermissions();

  const canAdd = can('customers', 'add');
  const canEdit = can('customers', 'edit');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customersList.filter(c => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
      const matchesDues = !duesFilter || (duesFilter === 'with' && c.pendingAmount > 0) || (duesFilter === 'cleared' && c.pendingAmount === 0);
      return matchesSearch && matchesDues;
    });
  }, [customersList, search, duesFilter]);

  const pagination = usePagination({
    data: filtered,
    pageSize: 6,
    sortFns: {
      name: (a, b) => a.name.localeCompare(b.name),
      pending: (a, b) => a.pendingAmount - b.pendingAmount,
    },
  });

  const totalPending = customersList.reduce((s, c) => s + c.pendingAmount, 0);
  const dueCount = customersList.filter(c => c.pendingAmount > 0).length;

  const openAdd = () => { setForm({ name: '', phone: '', address: '' }); setFormError({}); setAddOpen(true); };

  const handleSave = () => {
    const errs: typeof formError = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    setFormError(errs);
    if (Object.keys(errs).length > 0) return;
    setCustomers(prev => [...prev, { id: generateId(), name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() || undefined, pendingAmount: 0 }]);
    setAddOpen(false);
    addToast('success', 'Customer added');
  };

  const settleDues = (customer: Customer) => {
    if (customer.pendingAmount === 0) return;
    setCustomers(prev => prev.map(c => (c.id === customer.id ? { ...c, pendingAmount: 0 } : c)));
    setBills(prev => prev.map(b => b.customerId === customer.id && b.isUdhaar && !b.paid ? { ...b, paid: true } : b));
    if (selected?.id === customer.id) setSelected({ ...customer, pendingAmount: 0 });
    addToast('success', 'Dues settled', `${formatCurrency(customer.pendingAmount)} received from ${customer.name}`);
  };

  const customerBills = useMemo(() => selected ? bills.filter(b => b.customerId === selected.id) : [], [selected, bills]);

  const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customers and track pending dues.</p>
        </div>
        {canAdd && <Button variant="primary" icon={<Plus size={16} />} onClick={openAdd}>Add customer</Button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Customers" value={customersList.length.toString()} icon={<Users size={18} />} />
        <StatCard title="Pending Udhaar" value={formatCurrency(totalPending)} icon={<CircleDollarSign size={18} />} />
        <StatCard title="With Dues" value={dueCount.toString()} icon={<AlertCircle size={18} />} />
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <SearchInput placeholder="Search by name or phone..." value={search} onSearch={setSearch} />
          <Dropdown options={[{ label: 'All customers', value: '' }, { label: 'With dues', value: 'with' }, { label: 'Cleared', value: 'cleared' }]} value={duesFilter} onChange={e => setDuesFilter(e.target.value as DuesFilter)} />
        </div>
      </Card>

      <div className="hidden sm:block">
        <Table
          columns={[
            { key: 'name', header: 'Customer', sortable: true, render: c => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm shrink-0">{initial(c.name)}</div>
                <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
              </div>
            )},
            { key: 'phone', header: 'Phone', render: c => <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"><Phone size={14} /> {c.phone}</span> },
            { key: 'pending', header: 'Pending', sortable: true, render: c => c.pendingAmount > 0 ? <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{formatCurrency(c.pendingAmount)}</span> : <Badge variant="success">Cleared</Badge> },
            { key: 'actions', header: '', className: 'text-right', render: c => (
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={e => { e.stopPropagation(); setSelected(c); }}>View</Button>
                {canEdit && c.pendingAmount > 0 && <Button variant="primary" size="sm" onClick={e => { e.stopPropagation(); settleDues(c); }}>Settle</Button>}
              </div>
            )},
          ]}
          data={pagination.pageData}
          keyExtractor={c => c.id}
          emptyMessage="No customers found"
          onRowClick={c => setSelected(c)}
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
        {pagination.pageData.map(c => (
          <button key={c.id} type="button" onClick={() => setSelected(c)} className="block w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">{initial(c.name)}</div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} /> {c.phone}</p>
              </div>
              <div className="text-right shrink-0">
                {c.pendingAmount > 0 ? <p className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">{formatCurrency(c.pendingAmount)}</p> : <Badge variant="success">Cleared</Badge>}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add customer">
        <div className="space-y-4">
          <Input label="Name" placeholder="e.g. Ramesh Kumar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={formError.name} />
          <Input label="Phone" placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} error={formError.phone} />
          <Input label="Address (optional)" placeholder="Shop or home address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save customer</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-lg shrink-0">{initial(selected.name)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{selected.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1.5"><Phone size={13} /> {selected.phone}</p>
              </div>
              <div className="text-right">
                {selected.pendingAmount > 0 ? <p className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums text-lg">{formatCurrency(selected.pendingAmount)}</p> : <Badge variant="success">Cleared</Badge>}
              </div>
            </div>
            {canEdit && selected.pendingAmount > 0 && <Button variant="primary" size="lg" onClick={() => settleDues(selected)} className="w-full">Mark as paid</Button>}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Bills history</p>
              {customerBills.length === 0 ? (
                <Card><p className="text-center text-sm text-gray-500 py-4">No bills for this customer yet.</p></Card>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  {customerBills.map(b => (
                    <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div><p className="font-mono text-xs text-gray-500">{b.id}</p><p className="text-xs text-gray-500">{formatDate(b.date)} · {b.items.length} item{b.items.length === 1 ? '' : 's'}</p></div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(b.total)}</p>
                        {b.isUdhaar && !b.paid ? <Badge variant="warning">Udhaar</Badge> : <Badge variant="success">Paid</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
