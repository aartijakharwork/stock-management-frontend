import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Package,
  ReceiptText,
  Truck,
  Wallet,
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Settings,
  Shield,
  UserCog,
  CreditCard,
  Command as CommandIcon,
} from 'lucide-react';
import {
  customers,
  inventoryItems,
  bills,
  suppliers,
} from '../../data/shop-dummy';
import { formatCurrency } from '../../utils/formatters';

interface CmdItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  to: string;
  group: string;
  keywords?: string;
}

const NAV_ITEMS: CmdItem[] = [
  { id: 'nav-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, to: '/shop', group: 'Navigate' },
  { id: 'nav-billing', label: 'New Bill', icon: <ShoppingCart size={16} />, to: '/shop/billing', group: 'Navigate' },
  { id: 'nav-inventory', label: 'Inventory', icon: <Package size={16} />, to: '/shop/inventory', group: 'Navigate' },
  { id: 'nav-customers', label: 'Customers', icon: <Users size={16} />, to: '/shop/customers', group: 'Navigate' },
  { id: 'nav-bills', label: 'Bills history', icon: <ReceiptText size={16} />, to: '/shop/bills', group: 'Navigate' },
  { id: 'nav-expenses', label: 'Expenses', icon: <Wallet size={16} />, to: '/shop/expenses', group: 'Navigate' },
  { id: 'nav-suppliers', label: 'Suppliers', icon: <Truck size={16} />, to: '/shop/suppliers', group: 'Navigate' },
  { id: 'nav-reports', label: 'Reports', icon: <BarChart3 size={16} />, to: '/shop/reports', group: 'Navigate' },
  { id: 'nav-staff', label: 'Staff', icon: <UserCog size={16} />, to: '/shop/staff', group: 'Navigate' },
  { id: 'nav-roles', label: 'Roles', icon: <Shield size={16} />, to: '/shop/roles', group: 'Navigate' },
  { id: 'nav-settings', label: 'Settings', icon: <Settings size={16} />, to: '/shop/settings', group: 'Navigate' },
  { id: 'nav-subscription', label: 'Subscription', icon: <CreditCard size={16} />, to: '/shop/subscription', group: 'Navigate' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const allItems: CmdItem[] = useMemo(() => {
    const customerItems: CmdItem[] = customers.map(c => ({
      id: `c-${c.id}`,
      label: c.name,
      sublabel: c.pendingAmount > 0 ? `Udhaar ${formatCurrency(c.pendingAmount)} · ${c.phone}` : `Cleared · ${c.phone}`,
      icon: <Users size={16} className="text-blue-500" />,
      to: `/shop/customers/${c.id}`,
      group: 'Customers',
      keywords: `${c.name} ${c.phone} ${c.gstin ?? ''} ${c.area ?? ''}`,
    }));
    const itemRows: CmdItem[] = inventoryItems.map(i => ({
      id: `i-${i.id}`,
      label: i.name,
      sublabel: `${i.category} · ${formatCurrency(i.price)} · ${i.stock} ${i.unit}${i.stock === 1 ? '' : 's'}`,
      icon: <Package size={16} className="text-emerald-500" />,
      to: `/shop/inventory`,
      group: 'Inventory',
      keywords: `${i.name} ${i.sku ?? ''} ${i.barcode ?? ''} ${i.category} ${i.hsn ?? ''}`,
    }));
    const billRows: CmdItem[] = bills.map(b => ({
      id: `b-${b.id}`,
      label: b.id,
      sublabel: `${b.customerName} · ${formatCurrency(b.total)} · ${b.date}`,
      icon: <ReceiptText size={16} className="text-purple-500" />,
      to: `/shop/bills`,
      group: 'Bills',
      keywords: `${b.id} ${b.customerName}`,
    }));
    const supplierRows: CmdItem[] = suppliers.map(s => ({
      id: `s-${s.id}`,
      label: s.name,
      sublabel: `${s.contactPerson ?? ''} · ${s.phone}`,
      icon: <Truck size={16} className="text-orange-500" />,
      to: `/shop/suppliers`,
      group: 'Suppliers',
      keywords: `${s.name} ${s.phone} ${s.gstin ?? ''}`,
    }));
    return [...NAV_ITEMS, ...customerItems, ...itemRows, ...billRows, ...supplierRows];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.filter(i => i.group === 'Navigate');
    return allItems
      .filter(i => (i.keywords ?? i.label).toLowerCase().includes(q) || i.label.toLowerCase().includes(q))
      .slice(0, 30);
  }, [query, allItems]);

  const grouped = useMemo(() => {
    const map = new Map<string, CmdItem[]>();
    filtered.forEach(i => {
      if (!map.has(i.group)) map.set(i.group, []);
      map.get(i.group)!.push(i);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const flatItems = filtered;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[highlighted];
      if (item) {
        navigate(item.to);
        setOpen(false);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl mx-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-800">
          <Search size={18} className="text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setHighlighted(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search customers, items, bills, suppliers, or jump to a page…"
            className="flex-1 h-12 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
          />
          <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700">esc</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {flatItems.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No matches for "{query}"</p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="py-1">
                <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{group}</p>
                {items.map(item => {
                  const flatIdx = flatItems.indexOf(item);
                  const isActive = flatIdx === highlighted;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setHighlighted(flatIdx)}
                      onClick={() => { navigate(item.to); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-gray-900 dark:text-white truncate">{item.label}</span>
                        {item.sublabel && <span className="block text-xs text-gray-500 truncate">{item.sublabel}</span>}
                      </span>
                      {isActive && <span className="text-[10px] text-gray-400">↵</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">↑↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">↵</kbd> open</span>
          </div>
          <span className="flex items-center gap-1"><CommandIcon size={11} /> + K to toggle</span>
        </div>
      </div>
    </div>
  );
}
