import { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Printer, CreditCard, Receipt } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { Card } from '../components/ui/Card';
import { formatCurrency } from '../utils/formatters';
import type { CartItem, InventoryItem } from '../types';

const inventoryItems: InventoryItem[] = [];

export function Billing() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filteredItems = useMemo(() => {
    if (!search) return inventoryItems;
    const q = search.toLowerCase();
    return inventoryItems.filter(i =>
      i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [search]);

  const addToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      if (item.stock === 0) return prev;
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(c => {
          if (c.id !== id) return c;
          const newQty = c.quantity + delta;
          const maxQty = inventoryItems.find(i => i.id === id)?.stock || 0;
          if (newQty > maxQty) return c;
          return { ...c, quantity: newQty };
        })
        .filter(c => c.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleGenerateBill = (isUdhaar: boolean) => {
    if (cart.length === 0) return;
    alert(`Bill generated${isUdhaar ? ' (Udhaar)' : ''}!\nCustomer: ${customerName || 'Walk-in'}\nTotal: ${formatCurrency(total)}\nItems: ${itemCount}`);
    setCart([]);
    setCustomerName('');
    searchRef.current?.focus();
  };

  const handlePrint = () => {
    if (cart.length === 0) return;
    window.print();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      {/* Left — Item Selection */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <SearchInput
          ref={searchRef}
          placeholder="Search items by name or category..."
          onSearch={setSearch}
          value={search}
          autoFocus
        />
        <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map(item => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  disabled={item.stock === 0}
                  className={`flex items-center justify-between border-b border-r border-[var(--border-color)] p-3.5 text-left transition-all duration-150 cursor-pointer
                    ${item.stock === 0
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-primary-50 dark:hover:bg-primary-400/5 active:bg-primary-100 dark:active:bg-primary-400/10'
                    }
                    ${inCart ? 'bg-primary-50/60 dark:bg-primary-400/5' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">{item.name}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">{item.category} · {item.stock} left</p>
                  </div>
                  <div className="ml-3 text-right shrink-0">
                    <p className="text-[13px] font-bold text-primary-500 dark:text-primary-400">{formatCurrency(item.price)}</p>
                    {inCart && (
                      <p className="text-[11px] font-semibold text-primary-400">
                        x{inCart.quantity}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="col-span-full p-8 text-center text-[13px] text-[var(--text-tertiary)]">
                No items found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right — Cart / Bill Summary */}
      <div className="flex w-full flex-col lg:w-96">
        <Card className="flex flex-1 flex-col overflow-hidden" padding={false}>
          {/* Cart header */}
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] px-4 py-3">
            <ShoppingCart size={18} className="text-primary-500 dark:text-primary-400" />
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
              Cart
              {itemCount > 0 && <span className="ml-1 text-[12px] font-normal text-[var(--text-tertiary)]">({itemCount} items)</span>}
            </h2>
          </div>

          {/* Customer input */}
          <div className="border-b border-[var(--border-color)] px-4 py-2.5">
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
            />
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-[var(--text-tertiary)]">
                <ShoppingCart size={36} strokeWidth={1} />
                <p className="text-[13px]">Select items to add</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border-color)]">
                {cart.map(item => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">{item.name}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{formatCurrency(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-color)] hover:bg-[var(--hover-bg)] cursor-pointer transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-7 text-center text-[13px] font-bold text-[var(--text-primary)]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-color)] hover:bg-[var(--hover-bg)] cursor-pointer transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <p className="w-16 text-right text-[13px] font-semibold text-[var(--text-primary)]">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-md p-1 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Total and actions */}
          <div className="border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">Total</span>
              <span className="text-xl font-bold text-primary-500 dark:text-primary-400">{formatCurrency(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4">
              <Button
                size="lg"
                onClick={() => handleGenerateBill(false)}
                disabled={cart.length === 0}
                icon={<Receipt size={16} />}
                className="w-full"
              >
                Generate Bill
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => handleGenerateBill(true)}
                disabled={cart.length === 0}
                icon={<CreditCard size={16} />}
                className="w-full"
              >
                Mark Udhaar
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={handlePrint}
                disabled={cart.length === 0}
                icon={<Printer size={16} />}
                className="col-span-2 w-full"
              >
                Print Bill
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
