import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Truck, Wallet, FileText, Phone, ChevronRight } from 'lucide-react';
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
import { CardListSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { suppliers as initialSuppliers, purchases, inventoryItems } from '../../data/shop-dummy';
import { formatCurrency, formatDate, generateId, formatRelativeTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { usePagination } from '../../hooks/usePagination';
import type { Supplier, Purchase } from '../../types';
import type { ExportColumn } from '../../utils/exporters';

const emptySupplier: Omit<Supplier, 'id'> = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  gstin: '',
  payableBalance: 0,
  notes: '',
};

const SUPPLIER_EXPORT_COLUMNS: ExportColumn<Supplier>[] = [
  { header: 'Name', accessor: s => s.name },
  { header: 'Contact', accessor: s => s.contactPerson ?? '' },
  { header: 'Phone', accessor: s => s.phone },
  { header: 'GSTIN', accessor: s => s.gstin ?? '' },
  { header: 'Address', accessor: s => s.address ?? '' },
  { header: 'Payable (₹)', accessor: s => s.payableBalance },
  { header: 'Last order', accessor: s => s.lastOrderDate ?? '' },
];

export function ShopSuppliers() {
  const [items, setItems] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Omit<Supplier, 'id'>>(emptySupplier);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { can } = usePermissions();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const canAdd = can('suppliers', 'add');
  const canEdit = can('suppliers', 'edit');
  const canDelete = can('suppliers', 'delete');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(s => !term
      || s.name.toLowerCase().includes(term)
      || (s.contactPerson?.toLowerCase().includes(term) ?? false)
      || s.phone.includes(term)
      || (s.gstin?.toLowerCase().includes(term) ?? false));
  }, [items, search]);

  const pagination = usePagination({
    data: filtered,
    pageSize: 10,
    sortFns: {
      name: (a, b) => a.name.localeCompare(b.name),
      payable: (a, b) => a.payableBalance - b.payableBalance,
    },
  });

  const totalPayable = useMemo(() => items.reduce((s, i) => s + i.payableBalance, 0), [items]);
  const withDues = useMemo(() => items.filter(i => i.payableBalance > 0).length, [items]);

  const openAdd = () => { setEditing(null); setForm(emptySupplier); setModalOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson ?? '',
      phone: s.phone,
      email: s.email ?? '',
      address: s.address ?? '',
      gstin: s.gstin ?? '',
      payableBalance: s.payableBalance,
      lastOrderDate: s.lastOrderDate,
      notes: s.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      addToast('error', 'Name and phone are required');
      return;
    }
    if (editing) {
      setItems(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
      addToast('success', 'Supplier updated');
    } else {
      setItems(prev => [{ id: 'S' + generateId().slice(0, 4).toUpperCase(), ...form }, ...prev]);
      addToast('success', 'Supplier added');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    setItems(prev => prev.filter(s => s.id !== id));
    addToast('success', 'Supplier deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers / Vendors</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your wholesale partners and pending payables.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu<Supplier>
            baseName="suppliers"
            title="Suppliers export"
            meta={`${filtered.length} of ${items.length}`}
            columns={SUPPLIER_EXPORT_COLUMNS}
            rows={filtered}
            size="md"
          />
          {canAdd && <Button variant="secondary" icon={<FileText size={16} />} onClick={() => setPoModalOpen(true)}>New PO</Button>}
          {canAdd && <Button variant="primary" icon={<Plus size={16} />} onClick={openAdd}>Add supplier</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Suppliers" value={String(items.length)} icon={<Truck size={18} />} />
        <StatCard title="Total Payable" value={formatCurrency(totalPayable)} icon={<Wallet size={18} />} trend={withDues > 0 ? `${withDues} with dues` : 'All clear'} trendUp={withDues === 0} />
        <StatCard title="POs (this month)" value={String(purchases.filter(p => p.date.startsWith(new Date().toISOString().slice(0, 7))).length)} icon={<FileText size={18} />} />
        <StatCard title="Open POs" value={String(purchases.filter(p => p.status === 'placed').length)} icon={<FileText size={18} />} />
      </div>

      <Card>
        <SearchInput placeholder="Search supplier name, contact, GSTIN..." value={search} onSearch={setSearch} />
      </Card>

      {loading ? (
        <>
          <div className="hidden sm:block"><TableSkeleton rows={5} columns={5} /></div>
          <div className="sm:hidden"><CardListSkeleton rows={4} /></div>
        </>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Truck size={28} />}
            title={items.length === 0 ? 'No suppliers added yet' : 'No suppliers match search'}
            description={items.length === 0 ? 'Add your wholesale vendors to track purchase orders and payables.' : 'Try a different search term.'}
            action={items.length === 0 && canAdd ? <Button variant="primary" icon={<Plus size={14} />} onClick={openAdd}>Add first supplier</Button> : undefined}
          />
        </Card>
      ) : (
        <>
          <div className="hidden sm:block">
            <Table
              columns={[
                {
                  key: 'name',
                  header: 'Supplier',
                  sortable: true,
                  render: s => (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                      {s.contactPerson && <p className="text-xs text-gray-500">{s.contactPerson}</p>}
                    </div>
                  ),
                },
                {
                  key: 'phone',
                  header: 'Phone',
                  render: s => (
                    <a href={`tel:${s.phone}`} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">{s.phone}</a>
                  ),
                },
                {
                  key: 'gstin',
                  header: 'GSTIN',
                  render: s => <span className="text-xs font-mono text-gray-500">{s.gstin ?? '—'}</span>,
                },
                {
                  key: 'payable',
                  header: 'Payable',
                  sortable: true,
                  render: s => s.payableBalance > 0
                    ? <Badge variant="warning">{formatCurrency(s.payableBalance)}</Badge>
                    : <span className="text-xs text-gray-400">Clear</span>,
                  className: 'text-right',
                },
                {
                  key: 'last',
                  header: 'Last order',
                  render: s => s.lastOrderDate
                    ? <span className="text-xs text-gray-500">{formatRelativeTime(s.lastOrderDate)}</span>
                    : <span className="text-xs text-gray-400">—</span>,
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right w-44',
                  render: s => (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetailSupplier(s)}>View</Button>
                      {canEdit && <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(s)}>Edit</Button>}
                      {canDelete && <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(s.id, s.name)}>Del</Button>}
                    </div>
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
          </div>

          <ul className="space-y-3 sm:hidden">
            {pagination.pageData.map(s => (
              <li key={s.id} onClick={() => setDetailSupplier(s)} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                    {s.contactPerson && <p className="text-xs text-gray-500">{s.contactPerson}</p>}
                    <a href={`tel:${s.phone}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      <Phone size={11} /> {s.phone}
                    </a>
                  </div>
                  <div className="text-right shrink-0">
                    {s.payableBalance > 0 ? <Badge variant="warning">{formatCurrency(s.payableBalance)}</Badge> : <span className="text-xs text-gray-400">Clear</span>}
                    <ChevronRight size={16} className="text-gray-400 ml-auto mt-1" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit supplier' : 'Add supplier'} size="md">
        <div className="space-y-4">
          <Input label="Supplier name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mehta Auto Distributors" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact person" value={form.contactPerson ?? ''} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
            <Input label="Phone *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit" />
          </div>
          <Input label="Email" type="email" value={form.email ?? ''} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="GSTIN" value={form.gstin ?? ''} onChange={e => setForm({ ...form, gstin: e.target.value })} placeholder="07AABCM1234L1Z3" />
          <Input label="Address" value={form.address ?? ''} onChange={e => setForm({ ...form, address: e.target.value })} />
          <Input label="Opening payable (₹)" type="number" value={form.payableBalance || ''} onChange={e => setForm({ ...form, payableBalance: Number(e.target.value) })} />
          <Input label="Notes" value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Anything to remember about this vendor" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? 'Save changes' : 'Add supplier'}</Button>
          </div>
        </div>
      </Modal>

      {/* Supplier detail (ledger) */}
      {detailSupplier && (
        <SupplierLedgerModal supplier={detailSupplier} onClose={() => setDetailSupplier(null)} />
      )}

      {/* Quick PO modal */}
      <PurchaseOrderModal open={poModalOpen} onClose={() => setPoModalOpen(false)} suppliers={items} />
    </div>
  );
}

interface SupplierLedgerModalProps {
  supplier: Supplier;
  onClose: () => void;
}

function SupplierLedgerModal({ supplier, onClose }: SupplierLedgerModalProps) {
  const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id || p.supplier === supplier.name);
  const linkedItems = inventoryItems.filter(i => i.supplierId === supplier.id);
  const totalPurchased = supplierPurchases.reduce((s, p) => s + p.total, 0);
  const totalUnpaid = supplierPurchases.filter(p => !p.paid).reduce((s, p) => s + p.total, 0);

  return (
    <Modal open onClose={onClose} title={supplier.name} size="lg">
      <div className="space-y-5">
        {/* Supplier overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Phone</p>
            <a href={`tel:${supplier.phone}`} className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{supplier.phone}</a>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">GSTIN</p>
            <p className="text-xs font-mono text-gray-900 dark:text-white">{supplier.gstin ?? '—'}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Total purchased</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(totalPurchased)}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 uppercase tracking-wider">Outstanding</p>
            <p className="text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400">{formatCurrency(totalUnpaid + supplier.payableBalance)}</p>
          </div>
        </div>

        {/* Items supplied */}
        {linkedItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Items they supply ({linkedItems.length})</h3>
            <div className="flex flex-wrap gap-1.5">
              {linkedItems.slice(0, 12).map(i => (
                <span key={i.id} className="text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  {i.name}
                </span>
              ))}
              {linkedItems.length > 12 && <span className="text-xs text-gray-500 px-2 py-1">+{linkedItems.length - 12} more</span>}
            </div>
          </div>
        )}

        {/* Purchase history */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Purchase history</h3>
          {supplierPurchases.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No purchase orders yet.</p>
          ) : (
            <div className="space-y-2">
              {supplierPurchases.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.id}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.date)} · {p.items.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(p.total)}</p>
                    <Badge variant={p.paid ? 'success' : 'warning'}>{p.paid ? 'Paid' : 'Unpaid'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

interface PurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  suppliers: Supplier[];
}

interface POLine {
  name: string;
  quantity: number;
  price: number;
}

function PurchaseOrderModal({ open, onClose, suppliers: list }: PurchaseOrderModalProps) {
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState('');
  const [lines, setLines] = useState<POLine[]>([{ name: '', quantity: 1, price: 0 }]);
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  const total = lines.reduce((s, l) => s + l.quantity * l.price, 0);

  const updateLine = (idx: number, patch: Partial<POLine>) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  };
  const addLine = () => setLines(prev => [...prev, { name: '', quantity: 1, price: 0 }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!supplierId) { addToast('error', 'Pick a supplier'); return; }
    if (lines.length === 0 || lines.some(l => !l.name.trim() || !l.quantity)) {
      addToast('error', 'Add at least one item with quantity'); return;
    }
    addToast('success', `PO created for ${formatCurrency(total)}`);
    setSupplierId('');
    setLines([{ name: '', quantity: 1, price: 0 }]);
    setNotes('');
    setExpectedDate('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create purchase order" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Dropdown
            label="Supplier *"
            options={[{ label: 'Select supplier', value: '' }, ...list.map(s => ({ label: s.name, value: s.id }))]}
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
          />
          <Input label="PO date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Input label="Expected delivery" type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Line items</p>
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input label={idx === 0 ? 'Item' : ''} value={line.name} onChange={e => updateLine(idx, { name: e.target.value })} placeholder="Item name" />
                </div>
                <div className="w-20">
                  <Input label={idx === 0 ? 'Qty' : ''} type="number" value={line.quantity || ''} onChange={e => updateLine(idx, { quantity: Number(e.target.value) })} />
                </div>
                <div className="w-28">
                  <Input label={idx === 0 ? 'Cost ₹' : ''} type="number" value={line.price || ''} onChange={e => updateLine(idx, { price: Number(e.target.value) })} />
                </div>
                <button
                  onClick={() => removeLine(idx)}
                  className="p-2 text-gray-400 hover:text-red-500"
                  aria-label="Remove line"
                  disabled={lines.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addLine} className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">+ Add another item</button>
        </div>

        <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions for the supplier" />

        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <span className="text-sm text-gray-600 dark:text-gray-400">PO total</span>
          <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(total)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Create PO</Button>
        </div>
      </div>
    </Modal>
  );
}

// Re-export Purchase type to avoid type-only import unused warning
export type { Purchase };
