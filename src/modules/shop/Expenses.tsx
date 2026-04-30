import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Receipt,
  TrendingDown,
  Repeat,
  Wallet,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExportMenu } from '../../components/ui/ExportMenu';
import { Toggle } from '../../components/ui/Toggle';
import { CardListSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { expenses as initialExpenses } from '../../data/shop-dummy';
import { formatCurrency, formatDate, generateId } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { usePagination } from '../../hooks/usePagination';
import type { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import type { ExportColumn } from '../../utils/exporters';

const CATEGORIES: ExpenseCategory[] = ['Rent', 'Salaries', 'Utilities', 'Inventory', 'Marketing', 'Maintenance', 'Supplies', 'Misc'];
const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'upi', 'card'];

const CATEGORY_TONES: Record<string, { bg: string; text: string }> = {
  Rent:       { bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-700 dark:text-blue-400' },
  Salaries:   { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400' },
  Utilities:  { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-400' },
  Inventory:  { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
  Marketing:  { bg: 'bg-pink-50 dark:bg-pink-500/10',     text: 'text-pink-700 dark:text-pink-400' },
  Maintenance:{ bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400' },
  Supplies:   { bg: 'bg-teal-50 dark:bg-teal-500/10',     text: 'text-teal-700 dark:text-teal-400' },
  Misc:       { bg: 'bg-gray-100 dark:bg-gray-800',       text: 'text-gray-700 dark:text-gray-300' },
};

const emptyExpense: Omit<Expense, 'id'> = {
  date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: 0,
  category: 'Misc',
  vendor: '',
  recurring: false,
  paymentMethod: 'cash',
  receiptUrl: '',
  note: '',
};

const EXPORT_COLUMNS: ExportColumn<Expense>[] = [
  { header: 'Date', accessor: e => e.date },
  { header: 'Description', accessor: e => e.description },
  { header: 'Category', accessor: e => e.category },
  { header: 'Vendor', accessor: e => e.vendor ?? '' },
  { header: 'Amount (₹)', accessor: e => e.amount },
  { header: 'Method', accessor: e => e.paymentMethod ?? '' },
  { header: 'Recurring', accessor: e => e.recurring ? 'Yes' : 'No' },
];

export function ShopExpenses() {
  const [items, setItems] = useState<Expense[]>(initialExpenses);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<Omit<Expense, 'id'>>(emptyExpense);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { can } = usePermissions();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const canAdd = can('expenses', 'add');
  const canEdit = can('expenses', 'edit');
  const canDelete = can('expenses', 'delete');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(e => {
      const matchSearch = !term
        || e.description.toLowerCase().includes(term)
        || (e.vendor?.toLowerCase().includes(term) ?? false)
        || e.category.toString().toLowerCase().includes(term);
      const matchCat = !categoryFilter || e.category === categoryFilter;
      const matchRec = !recurringOnly || e.recurring;
      return matchSearch && matchCat && matchRec;
    });
  }, [items, search, categoryFilter, recurringOnly]);

  const pagination = usePagination({
    data: filtered,
    pageSize: 10,
    sortFns: {
      date: (a, b) => a.date.localeCompare(b.date),
      amount: (a, b) => a.amount - b.amount,
    },
  });

  const total = useMemo(() => items.reduce((s, e) => s + e.amount, 0), [items]);
  const thisMonth = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return items.filter(e => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
  }, [items]);
  const recurringCount = useMemo(() => items.filter(e => e.recurring).length, [items]);
  const recurringTotal = useMemo(() => items.filter(e => e.recurring).reduce((s, e) => s + e.amount, 0), [items]);

  const categoryBreakdown = useMemo(() => {
    const byCat: Record<string, number> = {};
    items.forEach(e => { byCat[e.category as string] = (byCat[e.category as string] ?? 0) + e.amount; });
    return Object.entries(byCat).sort(([, a], [, b]) => b - a);
  }, [items]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyExpense, date: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      date: e.date,
      description: e.description,
      amount: e.amount,
      category: e.category,
      vendor: e.vendor ?? '',
      recurring: e.recurring ?? false,
      paymentMethod: e.paymentMethod ?? 'cash',
      receiptUrl: e.receiptUrl ?? '',
      note: e.note ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.description.trim() || !form.amount) {
      addToast('error', 'Please fill description and amount');
      return;
    }
    if (editing) {
      setItems(prev => prev.map(e => e.id === editing.id ? { ...e, ...form } : e));
      addToast('success', 'Expense updated');
    } else {
      setItems(prev => [{ id: 'E' + generateId(), ...form }, ...prev]);
      addToast('success', 'Expense added');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, desc: string) => {
    if (!confirm(`Delete expense "${desc}"?`)) return;
    setItems(prev => prev.filter(e => e.id !== id));
    addToast('success', 'Expense deleted');
  };

  const handleReceiptUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(f => ({ ...f, receiptUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">Track shop running costs — rent, utilities, salaries, supplies.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu<Expense>
            baseName="expenses"
            title="Expenses export"
            meta={`${filtered.length} of ${items.length} entries`}
            columns={EXPORT_COLUMNS}
            rows={filtered}
            size="md"
          />
          {canAdd && <Button variant="primary" icon={<Plus size={16} />} onClick={openAdd}>Add expense</Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="This Month" value={formatCurrency(thisMonth)} icon={<TrendingDown size={18} />} />
        <StatCard title="All-time Total" value={formatCurrency(total)} icon={<Wallet size={18} />} />
        <StatCard title="Recurring" value={`${recurringCount} entries`} icon={<Repeat size={18} />} trend={`${formatCurrency(recurringTotal)} / cycle`} trendUp />
        <StatCard title="Entries" value={String(items.length)} icon={<Receipt size={18} />} />
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Spend by category</h3>
          <div className="space-y-2">
            {categoryBreakdown.map(([cat, amt]) => {
              const pct = total > 0 ? (amt / total) * 100 : 0;
              const tone = CATEGORY_TONES[cat] ?? CATEGORY_TONES.Misc;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-32 text-center ${tone.bg} ${tone.text}`}>{cat}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className={`h-full ${tone.bg.replace('bg-', 'bg-').replace('/10', '/40').replace('-50', '-300')}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-20 text-right">{formatCurrency(amt)}</span>
                  <span className="text-xs text-gray-500 tabular-nums w-12 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput placeholder="Search description, vendor, category..." value={search} onSearch={setSearch} className="flex-1" />
            <div className="flex items-center gap-2 shrink-0">
              <Toggle checked={recurringOnly} onChange={setRecurringOnly} />
              <span className="text-xs text-gray-500">Only recurring</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !categoryFilter ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/50' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              All ({items.length})
            </button>
            {CATEGORIES.map(c => {
              const count = items.filter(e => e.category === c).length;
              if (count === 0) return null;
              return (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    categoryFilter === c ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {c} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {loading ? (
        <>
          <div className="hidden sm:block"><TableSkeleton rows={6} columns={5} /></div>
          <div className="sm:hidden"><CardListSkeleton rows={5} showAvatar={false} /></div>
        </>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt size={28} />}
            title={items.length === 0 ? 'No expenses logged yet' : 'No expenses match your filters'}
            description={items.length === 0 ? 'Track every running cost — rent, electricity, salaries — to see your real profit.' : 'Try clearing search or category filters.'}
            action={items.length === 0 && canAdd ? <Button variant="primary" icon={<Plus size={14} />} onClick={openAdd}>Add first expense</Button> : <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setCategoryFilter(''); setRecurringOnly(false); }}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="hidden sm:block">
            <Table
              columns={[
                {
                  key: 'date',
                  header: 'Date',
                  sortable: true,
                  render: e => (
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">{formatDate(e.date)}</p>
                      {e.recurring && <Badge variant="info" className="mt-0.5">Recurring</Badge>}
                    </div>
                  ),
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: e => (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{e.description}</p>
                      {e.vendor && <p className="text-xs text-gray-500">to {e.vendor}</p>}
                    </div>
                  ),
                },
                {
                  key: 'category',
                  header: 'Category',
                  render: e => {
                    const tone = CATEGORY_TONES[e.category as string] ?? CATEGORY_TONES.Misc;
                    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tone.bg} ${tone.text}`}>{e.category}</span>;
                  },
                },
                {
                  key: 'method',
                  header: 'Method',
                  render: e => <span className="text-xs text-gray-500 uppercase">{e.paymentMethod ?? '—'}</span>,
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  sortable: true,
                  render: e => <span className="tabular-nums font-semibold text-red-600 dark:text-red-400">−{formatCurrency(e.amount)}</span>,
                  className: 'text-right',
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right w-32',
                  render: e => (
                    <div className="flex justify-end gap-1">
                      {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(e)}>Edit</Button>}
                      {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(e.id, e.description)}>Del</Button>}
                    </div>
                  ),
                },
              ]}
              data={pagination.pageData}
              keyExtractor={e => e.id}
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

          <ul className="space-y-3 sm:hidden">
            {pagination.pageData.map(e => {
              const tone = CATEGORY_TONES[e.category as string] ?? CATEGORY_TONES.Misc;
              return (
                <li key={e.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${tone.bg} ${tone.text}`}>{e.category}</span>
                        {e.recurring && <Badge variant="info">Recurring</Badge>}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.description}</p>
                      {e.vendor && <p className="text-xs text-gray-500 truncate">to {e.vendor}</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(e.date)} · {e.paymentMethod}</p>
                    </div>
                    <span className="tabular-nums font-semibold text-red-600 dark:text-red-400 shrink-0">−{formatCurrency(e.amount)}</span>
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="mt-3 flex gap-2 border-t border-gray-200 dark:border-gray-800 pt-3">
                      {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(e)} className="flex-1">Edit</Button>}
                      {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(e.id, e.description)} className="flex-1">Delete</Button>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit expense' : 'Add expense'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date *" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Amount (₹) *" type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
          <Input label="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Shop rent — April" />
          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Category"
              options={CATEGORIES.map(c => ({ label: c, value: c }))}
              value={form.category as string}
              onChange={e => setForm({ ...form, category: e.target.value as ExpenseCategory })}
            />
            <Dropdown
              label="Payment method"
              options={PAYMENT_METHODS.map(m => ({ label: m.toUpperCase(), value: m }))}
              value={form.paymentMethod ?? 'cash'}
              onChange={e => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
            />
          </div>
          <Input label="Vendor / Paid to" value={form.vendor ?? ''} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. BSES Rajdhani" />

          <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Repeat size={16} className="text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Recurring expense</p>
                <p className="text-xs text-gray-500">Repeats every cycle (rent, utilities, salaries)</p>
              </div>
            </div>
            <Toggle checked={form.recurring ?? false} onChange={v => setForm({ ...form, recurring: v })} />
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Receipt photo</label>
            {form.receiptUrl ? (
              <div className="relative inline-block">
                <img src={form.receiptUrl} alt="receipt" className="max-h-40 rounded-lg border border-gray-200 dark:border-gray-700" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, receiptUrl: '' })}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <ImageIcon size={20} className="text-gray-400" />
                <span className="text-xs text-gray-500">Upload receipt photo (optional)</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleReceiptUpload(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? 'Save changes' : 'Add expense'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

