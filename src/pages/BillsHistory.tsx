import { useState, useMemo } from 'react';
import { Printer } from 'lucide-react';
import { SearchInput } from '../components/ui/SearchInput';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Dropdown } from '../components/ui/Dropdown';
import { bills } from '../data/dummy';
import { formatCurrency, formatDate } from '../utils/formatters';

export function BillsHistory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return bills.filter(b => {
      const matchSearch = !search ||
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        b.customerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        !statusFilter ||
        (statusFilter === 'paid' && b.paid) ||
        (statusFilter === 'udhaar' && b.isUdhaar);
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const handleReprint = (id: string) => {
    alert(`Reprinting bill ${id}...`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput placeholder="Search by bill # or customer..." onSearch={setSearch} className="sm:w-80" />
        <Dropdown
          options={[
            { label: 'Paid', value: 'paid' },
            { label: 'Udhaar', value: 'udhaar' },
          ]}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          placeholder="All statuses"
          className="sm:w-40"
        />
      </div>

      <Table
        columns={[
          { key: 'id', header: 'Bill #', render: b => <span className="font-medium">{b.id}</span> },
          { key: 'date', header: 'Date', render: b => formatDate(b.date) },
          { key: 'customer', header: 'Customer', render: b => b.customerName },
          {
            key: 'items', header: 'Items', render: b =>
              <span className="text-[var(--text-secondary)]">{b.items.length} item{b.items.length > 1 ? 's' : ''}</span>,
          },
          { key: 'total', header: 'Amount', render: b => <span className="font-semibold">{formatCurrency(b.total)}</span> },
          {
            key: 'status', header: 'Status', render: b =>
              b.isUdhaar ? <Badge variant="warning">Udhaar</Badge> : <Badge variant="success">Paid</Badge>,
          },
          {
            key: 'actions', header: '', render: b => (
              <button onClick={() => handleReprint(b.id)} className="rounded p-1.5 hover:bg-[var(--hover-bg)] cursor-pointer" title="Reprint">
                <Printer size={16} className="text-[var(--text-secondary)]" />
              </button>
            ),
            className: 'w-12',
          },
        ]}
        data={filtered}
        keyExtractor={b => b.id}
        emptyMessage="No bills found"
      />
    </div>
  );
}
