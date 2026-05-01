import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ShoppingCart, Users, Package, Receipt, X } from 'lucide-react';
import { MVP_MODE } from '../../config/mvp';

export function MobileFAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on the billing page (POS already has its own primary actions)
  const hidden = location.pathname.includes('/shop/billing');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (hidden) return null;

  // In MVP mode the FAB is a single, dedicated "+ New Bill" button — no
  // expansion menu. Outside MVP mode it expands to four shortcuts.
  if (MVP_MODE) {
    return (
      <div className="lg:hidden fixed right-4 bottom-20 z-40">
        <button
          onClick={() => navigate('/shop/billing')}
          aria-label="New bill"
          className="h-14 pl-4 pr-5 rounded-full text-white shadow-lg flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all"
        >
          <ShoppingCart size={20} />
          <span className="text-sm font-semibold">New Bill</span>
        </button>
      </div>
    );
  }

  const actions = [
    { icon: <ShoppingCart size={16} />, label: 'New bill', to: '/shop/billing', tone: 'bg-emerald-600' },
    { icon: <Users size={16} />, label: 'Add customer', to: '/shop/customers', tone: 'bg-blue-500' },
    { icon: <Package size={16} />, label: 'Add item', to: '/shop/inventory', tone: 'bg-purple-500' },
    { icon: <Receipt size={16} />, label: 'View bills', to: '/shop/bills', tone: 'bg-orange-500' },
  ];

  return (
    <>
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setOpen(false)} />
      )}
      <div className="lg:hidden fixed right-4 bottom-20 z-40 flex flex-col items-end gap-2">
        {open && (
          <>
            {actions.map(a => (
              <button
                key={a.to}
                onClick={() => { navigate(a.to); setOpen(false); }}
                className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md text-sm text-gray-900 dark:text-white"
              >
                <span className="font-medium">{a.label}</span>
                <span className={`w-8 h-8 rounded-full ${a.tone} text-white flex items-center justify-center`}>{a.icon}</span>
              </button>
            ))}
          </>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Quick action menu'}
          className={`w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center transition-all ${
            open ? 'bg-gray-700 rotate-45' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {open ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>
    </>
  );
}
